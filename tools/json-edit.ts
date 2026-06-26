import { tool } from "@opencode-ai/plugin"
import * as fs from "fs"
import * as path from "path"
import { JSONPath } from "jsonpath-plus"

const VALID_ACTIONS = [
  "get", "set", "delete", "merge",
  "arrayAppend", "arrayRemove", "arrayInsert"
] as const

interface JsonPathMatch {
  value: unknown
  parent: Record<string, unknown> | unknown[]
  parentProperty: string | number
  path: string
  fullPath: string
}

export default tool({
  description: "Edit JSON/JSONC files using JSON Path — get, set, delete, merge, array operations. No jq or inline scripts.",
  args: {
    file: tool.schema.string().describe("Path to JSON file"),
    action: tool.schema.string().describe(`Operation. Valid: ${VALID_ACTIONS.join(", ")}`),
    path: tool.schema.string().describe("JSONPath expression, e.g. '$.config.port', '$.users[0].name', '$.store.book[*].author'"),
    value: tool.schema.any().optional().describe("Value for set / merge / arrayAppend / arrayInsert"),
    index: tool.schema.number().optional().describe("Array index (for arrayRemove by index, arrayInsert)"),
    removeValue: tool.schema.any().optional().describe("Value to remove from array (for arrayRemove by value)"),
    indentSize: tool.schema.number().optional().describe("JSON indent size (default: 2)"),
    trailingNewline: tool.schema.boolean().optional().describe("Ensure file ends with newline (default: true)"),
    dryRun: tool.schema.boolean().optional().describe("Preview changes without applying (default: false)")
  },
  async execute(args) {
    const { file, action, path: jsonPath, value, index, removeValue, dryRun } = args
    const indent = args.indentSize ?? 2

    if (!file) return err("file is required")
    if (!action) return err("action is required")
    if (!jsonPath) return err("path is required (JSONPath expression)")
    if (!VALID_ACTIONS.includes(action as any)) {
      return err(`Invalid action. Valid: ${VALID_ACTIONS.join(", ")}`)
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
      data = JSON.parse(original)
    } catch (e: any) {
      return err(`Invalid JSON: ${e.message}`)
    }

    const trailingNewline = args.trailingNewline !== false

    // ── Resolve path helper ────────────────────────────────────────────
    function resolvePath(pathExpr: string): JsonPathMatch[] {
      try {
        const raw = JSONPath({
          path: pathExpr,
          json: data,
          resultType: "all"
        }) as any
        return (Array.isArray(raw) ? raw : []) as JsonPathMatch[]
      } catch (e: any) {
        throw new Error(`JSONPath error: ${e.message}`)
      }
    }

    // ── Get ─────────────────────────────────────────────────────────────
    if (action === "get") {
      const matches = resolvePath(jsonPath)
      if (matches.length === 0) {
        return err(`Path "${jsonPath}" not found`)
      }
      return ok({
        action: "get",
        file,
        path: jsonPath,
        matches: matches.length,
        value: matches.length === 1 ? matches[0].value : matches.map(m => m.value),
        fullPaths: matches.map(m => m.fullPath || m.path)
      })
    }

    // ── Mutation operations ────────────────────────────────────────────
    const matches = resolvePath(jsonPath)
    if (matches.length === 0 && action !== "set") {
      return err(`Path "${jsonPath}" not found`)
    }

    const prevValue = matches.length > 0 ? clone(matches[0].value) : undefined

    try {
      switch (action) {
        case "set": {
          if (matches.length > 0) {
            const { parent, parentProperty } = matches[0]
            ;(parent as any)[parentProperty] = value
          } else {
            // Attempt to create on root object
            if (typeof data === "object" && data !== null && !Array.isArray(data)) {
              const key = jsonPath.replace(/^\$\.?/, "")
              if (key && !key.includes("[") && !key.includes(".")) {
                data[key] = value
              } else {
                return err(`Cannot create path "${jsonPath}". Use a simple dot-path like "$.newKey".`)
              }
            } else {
              return err(`Cannot set on non-object root at path "${jsonPath}"`)
            }
          }
          break
        }

        case "delete": {
          if (matches.length === 0) return err(`Path "${jsonPath}" not found`)
          const { parent, parentProperty } = matches[0]
          if (Array.isArray(parent)) {
            parent.splice(parentProperty as number, 1)
          } else {
            delete (parent as Record<string, unknown>)[parentProperty as string]
          }
          break
        }

        case "merge": {
          if (value === undefined || value === null || typeof value !== "object" || Array.isArray(value)) {
            return err("merge requires a plain object value")
          }
          if (matches.length === 0) return err(`Path "${jsonPath}" not found`)
          const { parent, parentProperty } = matches[0]
          const target = (parent as any)[parentProperty]
          if (typeof target !== "object" || target === null || Array.isArray(target)) {
            return err("merge target must be an object")
          }
          Object.assign(target, value)
          break
        }

        case "arrayAppend": {
          if (matches.length === 0) return err(`Path "${jsonPath}" not found`)
          const { parent, parentProperty } = matches[0]
          const arr = (parent as any)[parentProperty]
          if (!Array.isArray(arr)) return err("Path does not resolve to an array")
          arr.push(value)
          break
        }

        case "arrayRemove": {
          if (matches.length === 0) return err(`Path "${jsonPath}" not found`)
          const { parent, parentProperty } = matches[0]
          const arr = (parent as any)[parentProperty] as unknown[]
          if (!Array.isArray(arr)) return err("Path does not resolve to an array")
          if (index !== undefined) {
            if (index < 0 || index >= arr.length) return err(`Index ${index} out of bounds (array length: ${arr.length})`)
            arr.splice(index, 1)
          } else if (removeValue !== undefined) {
            const idx = arr.findIndex(v => JSON.stringify(v) === JSON.stringify(removeValue))
            if (idx === -1) return err("Value not found in array")
            arr.splice(idx, 1)
          } else {
            return err("Specify 'index' or 'removeValue' for arrayRemove")
          }
          break
        }

        case "arrayInsert": {
          if (index === undefined) return err("index is required for arrayInsert")
          if (matches.length === 0) return err(`Path "${jsonPath}" not found`)
          const { parent, parentProperty } = matches[0]
          const arr = (parent as any)[parentProperty] as unknown[]
          if (!Array.isArray(arr)) return err("Path does not resolve to an array")
          arr.splice(index, 0, value)
          break
        }

        default:
          return err(`Unknown action: ${action}`)
      }
    } catch (e: any) {
      return err(`Operation failed: ${e.message}`)
    }

    // Serialize
    const after = JSON.stringify(data, null, indent) + (trailingNewline ? "\n" : "")
    const changed = after !== original

    const newValue = resolvePath(jsonPath).length > 0
      ? (resolvePath(jsonPath).length === 1
        ? resolvePath(jsonPath)[0].value
        : resolvePath(jsonPath).map(m => m.value))
      : undefined

    if (dryRun) {
      return ok({
        action, file, path: jsonPath,
        dryRun: true, wouldChange: changed,
        previousValue: prevValue, newValue,
        diff: changed ? buildDiff(original, after) : "(no change)"
      })
    }

    if (!changed) {
      return ok({ action, file, path: jsonPath, changed: false, message: "No changes (value unchanged)" })
    }

    try {
      fs.writeFileSync(file, after, "utf-8")
      return ok({ action, file, path: jsonPath, changed: true, previousValue: prevValue, newValue, diff: buildDiff(original, after) })
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
