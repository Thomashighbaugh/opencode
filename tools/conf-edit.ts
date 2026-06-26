import { tool } from "@opencode-ai/plugin"
import * as fs from "fs"
import * as path from "path"

const VALID_ACTIONS = ["get", "set", "delete", "commentOut", "uncomment"] as const

interface ConfigEntry {
  raw: string
  key: string
  value: string
  isComment: boolean
  isSection: boolean
  section: string
  line: number
}

export default tool({
  description: "Edit config files (.env, INI, key=value) — get, set, delete, comment/uncomment keys. No sed required.",
  args: {
    file: tool.schema.string().describe("Path to config file"),
    action: tool.schema.string().describe(`Operation. Valid: ${VALID_ACTIONS.join(", ")}`),
    key: tool.schema.string().optional().describe("Key name (for get/set/delete/commentOut/uncomment)"),
    value: tool.schema.string().optional().describe("Value to set"),
    section: tool.schema.string().optional().describe("INI section header (e.g. 'database') for scoped operations"),
    separator: tool.schema.string().optional().describe("Key-value separator (default: '=')"),
    commentChar: tool.schema.string().optional().describe("Comment character (default: '#')"),
    format: tool.schema.string().optional().describe("Config format: 'auto', 'env', 'ini', or 'kv'. Default: 'auto'"),
    dryRun: tool.schema.boolean().optional().describe("Preview changes without applying (default: false)")
  },
  async execute(args) {
    const { file, action: actionName, key, value, section, dryRun } = args
    const separator = args.separator || "="
    const commentChar = args.commentChar || "#"

    if (!file) return err("file is required")
    if (!actionName) return err("action is required")
    if (!VALID_ACTIONS.includes(actionName as any)) {
      return err(`Invalid action. Valid: ${VALID_ACTIONS.join(", ")}`)
    }

    let original: string
    let lines: string[]
    try {
      original = fs.readFileSync(file, "utf-8")
      lines = original.split("\n")
    } catch (e: any) {
      return err(`Cannot read file: ${e.message}`)
    }

    const newline = original.includes("\r\n") ? "\r\n" : "\n"
    const fmt = args.format || detectFormat(file, lines)

    // ── Parsing ─────────────────────────────────────────────────────────
    function parseLine(raw: string, lineNum: number): ConfigEntry {
      const trimmed = raw.trim()
      const entry: ConfigEntry = {
        raw, key: "", value: "",
        isComment: trimmed.startsWith(commentChar),
        isSection: false,
        section: "",
        line: lineNum
      }

      if (entry.isComment) return entry

      // Section header: [section]
      if (fmt === "ini" || fmt === "auto") {
        const sectionMatch = trimmed.match(/^\[(.+)\]$/)
        if (sectionMatch) {
          entry.isSection = true
          entry.key = sectionMatch[1]
          return entry
        }
      }

      // Key=value (or key:value or key value)
      const sepIdx = trimmed.indexOf(separator)
      if (sepIdx > 0) {
        entry.key = trimmed.substring(0, sepIdx).trim()
        entry.value = trimmed.substring(sepIdx + separator.length).trim()
      }

      return entry
    }

    function parseAll(): ConfigEntry[] {
      const entries: ConfigEntry[] = []
      for (let i = 0; i < lines.length; i++) {
        entries.push(parseLine(lines[i], i))
      }
      return entries
    }

    // ── Find current section context ────────────────────────────────────
    function getCurrentSection(entries: ConfigEntry[], targetLine: number): string {
      let currentSection = ""
      for (const e of entries) {
        if (e.line >= targetLine) break
        if (e.isSection) currentSection = e.key
      }
      return currentSection
    }

    function findEntries(entries: ConfigEntry[], targetKey: string): ConfigEntry[] {
      const result: ConfigEntry[] = []
      let currentSection = ""
      for (const e of entries) {
        if (e.isSection) currentSection = e.key
        if (!e.isComment && !e.isSection && e.key === targetKey) {
          if (!section || currentSection === section) {
            result.push(e)
          }
        }
      }
      return result
    }

    function findEntryInSection(entries: ConfigEntry[], targetKey: string): ConfigEntry | null {
      const found = findEntries(entries, targetKey)
      return found.length > 0 ? found[0] : null
    }

    // ── Get ─────────────────────────────────────────────────────────────
    if (actionName === "get") {
      if (!key) return err("key is required for get")
      const entries = parseAll()
      const matched = findEntries(entries, key)
      if (matched.length === 0) {
        return err(`Key "${key}" not found${section ? ` in section [${section}]` : ""}`)
      }
      return ok({
        action: "get",
        file,
        key,
        matches: matched.map(m => ({
          value: m.value,
          line: m.line + 1,
          section: getCurrentSection(entries, m.line)
        }))
      })
    }

    // ── Set ─────────────────────────────────────────────────────────────
    if (actionName === "set") {
      if (!key) return err("key is required for set")
      const entries = parseAll()
      const existing = section
        ? entries.filter(e => !e.isComment && !e.isSection && e.key === key && getCurrentSection(entries, e.line) === section)
        : findEntries(entries, key)

      let changed = false
      let prevValue = ""

      if (existing.length > 0) {
        // Update existing
        prevValue = existing[0].value
        const eqIdx = lines[existing[0].line].indexOf(separator)
        if (eqIdx >= 0) {
          lines[existing[0].line] = lines[existing[0].line].substring(0, eqIdx) + `${separator}${value}`
        } else {
          // Fallback: rebuild the line
          lines[existing[0].line] = `${key}${separator}${value}`
        }
        changed = true
      } else {
        // Insert new: find the section if needed, or append
        if (section && fmt !== "kv") {
          // Find section header
          const sectionIdx = entries.findIndex(e => e.isSection && e.key === section)
          if (sectionIdx >= 0) {
            // Insert after section header's content (skip the header itself)
            let insertIdx = sectionIdx + 1
            while (insertIdx < entries.length &&
                   !entries[insertIdx].isSection &&
                   insertIdx <= sectionIdx + 1) {
              insertIdx++
            }
            // Actually, just insert right after the section header
            lines.splice(entries[sectionIdx].line + 1, 0, `${key}${separator}${value}`)
          } else {
            // Section doesn't exist — create it
            lines.push("")
            lines.push(`[${section}]`)
            lines.push(`${key}${separator}${value}`)
          }
        } else {
          lines.push(`${key}${separator}${value}`)
        }
        changed = true
      }

      if (!changed) {
        return ok({ action: "set", file, key, changed: false, message: "No changes needed" })
      }

      const result = lines.join(newline)
      const diff = prevValue
        ? `Updated: ${key} = ${prevValue} → ${value}`
        : `Added: ${key} = ${value}`

      if (dryRun) {
        return ok({ action: "set", file, key, dryRun: true, wouldChange: true, previousValue: prevValue || null, newValue: value, diff })
      }

      try {
        fs.writeFileSync(file, result, "utf-8")
        return ok({ action: "set", file, key, changed: true, previousValue: prevValue || null, newValue: value, diff })
      } catch (e: any) {
        return err(`Cannot write file: ${e.message}`)
      }
    }

    // ── Delete ──────────────────────────────────────────────────────────
    if (actionName === "delete") {
      if (!key) return err("key is required for delete")
      const entries = parseAll()
      const matched = findEntries(entries, key)
      if (matched.length === 0) {
        return err(`Key "${key}" not found${section ? ` in section [${section}]` : ""}`)
      }

      const prevValue = matched[0].value
      // Mark line for deletion (we'll rebuild without it)
      const deleteIndices = new Set(matched.map(m => m.line))
      const newLines = lines.filter((_, i) => !deleteIndices.has(i))
      const result = newLines.join(newline)

      if (dryRun) {
        return ok({ action: "delete", file, key, dryRun: true, wouldChange: true, previousValue: prevValue, diff: `Deleted: ${key} = ${prevValue}` })
      }

      try {
        fs.writeFileSync(file, result, "utf-8")
        return ok({ action: "delete", file, key, changed: true, previousValue: prevValue, diff: `Deleted: ${key} = ${prevValue}` })
      } catch (e: any) {
        return err(`Cannot write file: ${e.message}`)
      }
    }

    // ── Comment Out / Uncomment ─────────────────────────────────────────
    if (actionName === "commentOut" || actionName === "uncomment") {
      if (!key) return err("key is required")

      const entries = parseAll()

      if (actionName === "commentOut") {
        const matched = findEntries(entries, key)
        if (matched.length === 0) return err(`Key "${key}" not found`)

        let count = 0
        for (const m of matched) {
          if (!lines[m.line].trim().startsWith(commentChar)) {
            lines[m.line] = `${commentChar} ${lines[m.line]}`
            count++
          }
        }
        if (count === 0) return ok({ action: "commentOut", file, key, changed: false, message: "Already commented" })

        const result = lines.join(newline)
        if (dryRun) return ok({ action: "commentOut", file, key, dryRun: true, wouldChange: true, diff: `Commented out ${count} occurrence(s) of "${key}"` })

        try {
          fs.writeFileSync(file, result, "utf-8")
          return ok({ action: "commentOut", file, key, changed: true, diff: `Commented out ${count} occurrence(s) of "${key}"` })
        } catch (e: any) {
          return err(`Cannot write file: ${e.message}`)
        }
      }

      if (actionName === "uncomment") {
        const re = new RegExp(`^\\s*${escapeRegex(commentChar)}\\s*(.*)$`)
        let count = 0
        for (let i = 0; i < lines.length; i++) {
          const trimmed = lines[i].trim()
          const match = trimmed.match(re)
          if (match) {
            const uncommented = match[1].trim()
            // Check if the uncommented line has our key
            if (uncommented.startsWith(`${key}${separator}`) || uncommented.startsWith(`${key} `)) {
              lines[i] = uncommented
              count++
            }
          }
        }
        if (count === 0) return err(`No commented "${key}" found`)

        const result = lines.join(newline)
        if (dryRun) return ok({ action: "uncomment", file, key, dryRun: true, wouldChange: true, diff: `Uncommented ${count} occurrence(s) of "${key}"` })

        try {
          fs.writeFileSync(file, result, "utf-8")
          return ok({ action: "uncomment", file, key, changed: true, diff: `Uncommented ${count} occurrence(s) of "${key}"` })
        } catch (e: any) {
          return err(`Cannot write file: ${e.message}`)
        }
      }
    }

    return err(`Unknown action: ${actionName}`)
  }
})

// ── Helpers ──────────────────────────────────────────────────────────────

function detectFormat(filePath: string, lines: string[]): string {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === ".env") return "env"
  if (ext === ".ini") return "ini"
  if (lines.some(l => l.trim().match(/^\[.+\]$/))) return "ini"
  if (lines.some(l => l.trim().match(/^[A-Za-z_][A-Za-z0-9_]*=/))) return "env"
  return "kv"
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function ok(data: Record<string, unknown>) {
  return JSON.stringify({ success: true, ...data })
}

function err(msg: string) {
  return JSON.stringify({ success: false, error: msg })
}
