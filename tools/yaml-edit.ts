import { tool } from "@opencode-ai/plugin"
import * as fs from "fs"
import * as path from "path"
import * as yaml from "js-yaml"

const VALID_ACTIONS = [
  "get", "set", "delete", "merge",
  "arrayAppend", "arrayRemove", "arrayInsert"
] as const

export default tool({
  description: "Edit YAML files using dot-path notation — get, set, delete, merge, and array operations. No yq or sed-on-YAML needed.",
  args: {
    file: tool.schema.string().describe("Path to YAML file (.yaml or .yml)"),
    action: tool.schema.string().describe(`Operation. Valid: ${VALID_ACTIONS.join(", ")}`),
    path: tool.schema.string().describe("Dot-path to navigate, e.g. 'server.port', 'users.0.name', 'database.hosts'"),
    value: tool.schema.any().optional().describe("Value for set / merge / arrayAppend / arrayInsert"),
    index: tool.schema.number().optional().describe("Array index (for arrayRemove by index, arrayInsert)"),
    removeValue: tool.schema.any().optional().describe("Value to remove from array (for arrayRemove by value)"),
    indentSize: tool.schema.number().optional().describe("YAML indent size (default: 2)"),
    lineWidth: tool.schema.number().optional().describe("Max line width for YAML output (default: 120)"),
    dryRun: tool.schema.boolean().optional().describe("Preview changes without applying (default: false)")
  },
  async execute(args) {
    const { file, action: actionName, path: dotPath, value, index, removeValue, dryRun } = args
    const indent = args.indentSize ?? 2
    const lineWidth = args.lineWidth ?? 120

    if (!file) return err("file is required")
    if (!actionName) return err("action is required")
    if (!VALID_ACTIONS.includes(actionName as any)) {
      return err(`Invalid action. Valid: ${VALID_ACTIONS.join(", ")}`)
    }
    if (!dotPath && actionName !== "set") {
      // For set action, path can be empty to set the root
      return err("path is required")
    }

    // Read and parse
    let original: string
    let data: any
    try {
      original = fs.readFileSync(file, "utf-8")
    } catch (e: any) {
      return err(`Cannot read file: ${e.message}`)
    }
    try {
      data = yaml.load(original)
    } catch (e: any) {
      return err(`Invalid YAML: ${e.message}`)
    }
    // yaml.load can return null/undefined for empty files
    if (data === null || data === undefined) {
      data = {}
    }

    // ── Path navigation helpers ─────────────────────────────────────────
    function parsePath(p: string): string[] {
      return p.split(".").flatMap(seg => {
        const bracketMatch = seg.match(/^(\w+)\[(\d+)\]$/)
        if (bracketMatch) {
          return [bracketMatch[1], bracketMatch[2]]
        }
        const arrayMatch = seg.match(/^\[(\d+)\]$/)
        if (arrayMatch) {
          return [arrayMatch[1]]
        }
        return [seg]
      })
    }

    function resolvePath(obj: any, segments: string[], create = false): { parent: any; key: string | number; value: any } | null {
      let current = obj
      for (let i = 0; i < segments.length - 1; i++) {
        const seg = isNaN(Number(segments[i])) ? segments[i] : Number(segments[i])
        if (current === null || current === undefined) {
          if (create) {
            const nextSeg = isNaN(Number(segments[i + 1])) ? segments[i + 1] : Number(segments[i + 1])
            current = {}
            // We need to set this on the parent. But we don't have parent ref here.
            // Let's handle with a different approach.
          }
          return null
        }
        const next = current[seg]
        if ((next === null || next === undefined) && create) {
          const nextSeg = isNaN(Number(segments[i + 1])) ? segments[i + 1] : Number(segments[i + 1])
          current[seg] = typeof nextSeg === "number" ? [] : {}
          current = current[seg]
        } else {
          current = next
        }
      }
      if (current === null || current === undefined) return null
      const lastKey = isNaN(Number(segments[segments.length - 1]))
        ? segments[segments.length - 1]
        : Number(segments[segments.length - 1])
      return { parent: current, key: lastKey, value: current[lastKey] }
    }

    function resolveOrCreate(obj: any, segments: string[]): { parent: any; key: string | number; value: any } {
      let current = obj
      for (let i = 0; i < segments.length - 1; i++) {
        const seg = isNaN(Number(segments[i])) ? segments[i] : Number(segments[i])
        if (current[seg] === undefined || current[seg] === null) {
          const nextSeg = segments[i + 1]
          const isNextNum = !isNaN(Number(nextSeg))
          current[seg] = isNextNum ? [] : {}
        }
        current = current[seg]
      }
      const lastKey = isNaN(Number(segments[segments.length - 1]))
        ? segments[segments.length - 1]
        : Number(segments[segments.length - 1])
      return { parent: current, key: lastKey, value: current[lastKey] }
    }

    const segments = dotPath ? parsePath(dotPath) : []

    // ── Execute action ──────────────────────────────────────────────────
    let prevValue: any = undefined
    let changed = false

    if (actionName === "get") {
      const resolved = segments.length > 0 ? resolvePath(data, segments) : { parent: null, key: "", value: data }
      if (!resolved || resolved.value === undefined) {
        return err(`Path "${dotPath}" not found`)
      }
      return ok({ action: "get", file, path: dotPath, value: resolved.value })
    }

    if (actionName === "set") {
      if (segments.length === 0) {
        // Setting root
        prevValue = clone(data)
        data = value
        changed = true
      } else {
        const resolved = resolveOrCreate(data, segments)
        prevValue = clone(resolved.value)
        resolved.parent[resolved.key] = value
        changed = true
      }
    } else if (actionName === "delete") {
      const resolved = resolvePath(data, segments)
      if (!resolved || resolved.value === undefined) {
        return err(`Path "${dotPath}" not found`)
      }
      prevValue = clone(resolved.value)
      if (Array.isArray(resolved.parent)) {
        resolved.parent.splice(resolved.key as number, 1)
      } else {
        delete resolved.parent[resolved.key as string]
      }
      changed = true
    } else if (actionName === "merge") {
      if (value === undefined || value === null || typeof value !== "object" || Array.isArray(value)) {
        return err("merge requires a plain object value")
      }
      const resolved = resolvePath(data, segments)
      if (!resolved || typeof resolved.value !== "object" || resolved.value === null || Array.isArray(resolved.value)) {
        return err(`Path "${dotPath}" must resolve to an object for merge`)
      }
      prevValue = clone(resolved.value)
      Object.assign(resolved.value, value)
      changed = true
    } else if (actionName === "arrayAppend") {
      const resolved = resolvePath(data, segments)
      if (!resolved || !Array.isArray(resolved.value)) {
        return err(`Path "${dotPath}" must resolve to an array for arrayAppend`)
      }
      prevValue = clone(resolved.value)
      resolved.value.push(value)
      changed = true
    } else if (actionName === "arrayRemove") {
      const resolved = resolvePath(data, segments)
      if (!resolved || !Array.isArray(resolved.value)) {
        return err(`Path "${dotPath}" must resolve to an array for arrayRemove`)
      }
      prevValue = clone(resolved.value)
      if (index !== undefined) {
        if (index < 0 || index >= resolved.value.length) {
          return err(`Index ${index} out of bounds (array length: ${resolved.value.length})`)
        }
        resolved.value.splice(index, 1)
      } else if (removeValue !== undefined) {
        const idx = resolved.value.findIndex((v: any) => JSON.stringify(v) === JSON.stringify(removeValue))
        if (idx === -1) return err("Value not found in array")
        resolved.value.splice(idx, 1)
      } else {
        return err("Specify 'index' or 'removeValue' for arrayRemove")
      }
      changed = true
    } else if (actionName === "arrayInsert") {
      if (index === undefined) return err("index is required for arrayInsert")
      const resolved = resolvePath(data, segments)
      if (!resolved || !Array.isArray(resolved.value)) {
        return err(`Path "${dotPath}" must resolve to an array for arrayInsert`)
      }
      prevValue = clone(resolved.value)
      resolved.value.splice(index, 0, value)
      changed = true
    }

    // Serialize
    const after = yaml.dump(data, { indent, lineWidth, noRefs: true })
    const originalNormalized = yaml.dump(yaml.load(original) || {}, { indent, lineWidth, noRefs: true })
    const contentChanged = after !== originalNormalized

    // Get new value for display
    let newValue: any = undefined
    if (segments.length > 0) {
      const r = resolvePath(data, segments)
      if (r) newValue = r.value
    } else {
      newValue = data
    }

    if (dryRun) {
      return ok({
        action: actionName, file, path: dotPath,
        dryRun: true, wouldChange: contentChanged,
        previousValue: prevValue, newValue,
        diff: contentChanged ? buildDiff(original, after) : "(no change)"
      })
    }

    if (!contentChanged) {
      return ok({ action: actionName, file, path: dotPath, changed: false, message: "No changes (value unchanged)" })
    }

    try {
      fs.writeFileSync(file, after, "utf-8")
      return ok({ action: actionName, file, path: dotPath, changed: true, previousValue: prevValue, newValue, diff: buildDiff(original, after) })
    } catch (e: any) {
      return err(`Cannot write file: ${e.message}`)
    }
  }
})

// ── Helpers ──────────────────────────────────────────────────────────────

function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

function buildDiff(before: string, after: string): string {
  const b = before.split("\n")
  const a = after.split("\n")
  const parts: string[] = []
  for (let i = 0; i < Math.max(b.length, a.length); i++) {
    if (b[i] !== a[i]) {
      if (b[i] !== undefined) parts.push(`- ${b[i]}`)
      if (a[i] !== undefined) parts.push(`+ ${a[i]}`)
    }
  }
  return parts.join("\n")
}

function ok(data: Record<string, unknown>) {
  return JSON.stringify({ success: true, ...data })
}

function err(msg: string) {
  return JSON.stringify({ success: false, error: msg })
}
