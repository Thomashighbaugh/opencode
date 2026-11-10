/**
 * tool-scaffolder.ts — generate OpenCode 2 tool plugins.
 *
 * V1 shipped tools as bare files: `tools/foo.ts` exported `tool({...})` and
 * the runtime discovered it by scanning the directory. V2 removed that scan.
 * A file under `.opencode/tools/` is now inert — a tool exists only when a
 * plugin registers it through `ctx.tool.transform(editor => editor.add(...))`.
 *
 * So a scaffolded tool is not a file, it is a *plugin*: one directory per tool
 * under `.opencode/plugins/`, whose `index.ts` registers the tool itself.
 * OpenCode 2 auto-discovers every directory under `.opencode/plugins/`, which
 * means a freshly scaffolded tool works with no further wiring.
 *
 * The generated input schema is plain JSON Schema rather than zod on purpose:
 * a project plugin should not acquire a zod dependency to describe four
 * arguments. (This repository's own tools use zod — it already depends on it —
 * and `plugins/tools/index.ts` converts those schemas on the way in.)
 */

import { z } from "zod/v4"
import * as fs from "fs"
import * as path from "path"
import { homedir } from "os"
import type { ToolDefinition } from "./types"

const VALID_ACTIONS = ["generate", "validate"] as const
const VALID_LANGUAGES = ["typescript", "bash"] as const
type Language = (typeof VALID_LANGUAGES)[number]

// ─── ParamSpec ─────────────────────────────────────────────────────────

interface ParamSpec {
  name: string
  type: "string" | "number" | "boolean" | "array" | "object"
  required: boolean
  description: string
  enum?: string[]
}

function parseParams(raw: string): ParamSpec[] {
  try {
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) throw new Error("params must be a JSON array")
    return arr.map((p: any, i: number) => ({
      name: p.name || `param${i + 1}`,
      type: ["string", "number", "boolean", "array", "object"].includes(p.type) ? p.type : "string",
      required: p.required !== false,
      description: p.description || p.name || `param${i + 1}`,
      enum: p.enum,
    }))
  } catch (e: any) {
    throw new Error(`Invalid params JSON: ${e.message}`)
  }
}

// ─── TypeScript generator ──────────────────────────────────────────────

/** JSON Schema type for one parameter. */
function jsonType(type: ParamSpec["type"]): string {
  return type
}

/** TypeScript type for one parameter. */
function tsType(type: ParamSpec["type"]): string {
  switch (type) {
    case "number":
      return "number"
    case "boolean":
      return "boolean"
    case "array":
      return "string[]"
    case "object":
      return "Record<string, unknown>"
    default:
      return "string"
  }
}

function jsonSchemaFor(p: ParamSpec): string {
  const parts: string[] = []
  if (p.type === "array") parts.push(`type: "array"`, `items: { type: "string" }`)
  else parts.push(`type: "${jsonType(p.type)}"`)
  if (p.enum?.length) parts.push(`enum: [${p.enum.map((v) => JSON.stringify(v)).join(", ")}]`)
  parts.push(`description: ${JSON.stringify(p.description)}`)
  return parts.join(", ")
}

function generateTS(params: ParamSpec[], name: string, description: string): string {
  const hasParams = params.length > 0

  const iface = hasParams
    ? `interface Args {
${params.map((p) => `  ${p.name}${p.required ? "" : "?"}: ${tsType(p.type)}`).join("\n")}
}

`
    : `interface Args {}

`

  const properties = hasParams
    ? `\n  properties: {
${params.map((p) => `    ${p.name}: { ${jsonSchemaFor(p)} },`).join("\n")}
  },`
    : ""

  const required = hasParams ? params.filter((p) => p.required).map((p) => p.name) : []
  const requiredBlock = required.length ? `\n  required: [${required.map((r) => JSON.stringify(r)).join(", ")}],` : ""

  return `/**
 * ${name} — OpenCode 2 tool.
 *
 * V2 removed file-based tool discovery: a file under \`.opencode/tools/\` is
 * inert until a plugin registers it. This file *is* that plugin — OpenCode 2
 * auto-discovers every directory under \`.opencode/plugins/\` and loads its
 * \`index.ts\`.
 *
 * The input schema is plain JSON Schema on purpose: a project plugin should
 * not need a zod dependency to describe a few arguments.
 */

${iface}const input = {
  type: "object" as const,${properties}${requiredBlock}
}

export default {
  id: ${JSON.stringify(name)},
  setup(ctx: any) {
    ctx.tool.transform((editor: any) => {
      editor.add({
        name: ${JSON.stringify(name)},
        description: ${JSON.stringify(description)},
        input,
        // codemode: false keeps the tool on the provider's native tool list.
        options: { codemode: false },
        execute: async (args: Args, context: any) => {
          const projectRoot = ctx?.location?.directory ?? context?.directory ?? process.cwd()
          // TODO: implement tool logic
          return { content: JSON.stringify({ ok: true, tool: ${JSON.stringify(name)} }) }
        },
      })
    })
  },
}
`
}

function validateTS(content: string): string[] {
  const issues: string[] = []
  if (!content.includes("export default {")) issues.push("Missing default export (V2 tools are plugins: `{ id, setup }`)")
  if (!content.includes("setup(")) issues.push("Missing setup() — a V2 tool must be registered by a plugin")
  if (!content.includes("ctx.tool.transform")) issues.push("Missing ctx.tool.transform registration")
  if (!content.includes("editor.add(")) issues.push("Missing editor.add() — the tool is never registered")
  if (!content.includes("name:")) issues.push("Missing tool name")
  if (!content.includes("description:")) issues.push("Missing description field")
  if (!content.includes("input")) issues.push("Missing input schema")
  if (!content.includes("async execute")) issues.push("Missing async execute handler")
  if (content.includes('from "@opencode-ai/plugin"')) issues.push("V1 import found — V2 plugins must not import @opencode/plugin at runtime")
  if (content.includes("export default tool(")) issues.push("V1 `export default tool({` shape found — V2 registers through a plugin")
  return issues
}

// ─── Bash generator ────────────────────────────────────────────────────

function generateBash(params: ParamSpec[], name: string, description: string): string {
  const lines: string[] = [
    "#!/usr/bin/env bash",
    `# ${description}`,
    "set -euo pipefail",
    "",
    "usage() {",
    `  echo "Usage: $0 [OPTIONS]"`,
    '  echo ""',
    '  echo "Options:"',
  ]

  for (const p of params) {
    const flag = `--${p.name.replace(/_/g, "-")}`
    const req = p.required && p.type !== "boolean" ? " (required)" : ""
    const typeHint = p.type === "boolean" ? "flag" : `<${p.type === "number" ? "num" : "str"}>`
    lines.push(`  echo "  ${flag} ${typeHint}${req}  ${p.description}"`)
  }

  lines.push("  exit 1")
  lines.push("}")
  lines.push("")

  for (const p of params) {
    const varname = p.name.toUpperCase().replace(/-/g, "_")
    if (p.type === "boolean") {
      lines.push(`${varname}=false`)
    } else if (p.type === "number") {
      lines.push(`${varname}=0`)
    } else if (p.type === "array") {
      lines.push(`${varname}=()`)
    } else {
      lines.push(`${varname}=""`)
    }
  }
  lines.push("")

  if (params.length > 0) {
    lines.push("while [[ $# -gt 0 ]]; do")
    lines.push("    case $1 in")
    for (const p of params) {
      const flag = `--${p.name.replace(/_/g, "-")}`
      const varname = p.name.toUpperCase().replace(/-/g, "_")
      if (p.type === "boolean") {
        lines.push(`        ${flag}) ${varname}=true; shift ;;`)
      } else if (p.type === "array") {
        lines.push(`        ${flag}) ${varname}+=("$2"); shift 2 ;;`)
      } else {
        lines.push(`        ${flag}) ${varname}="$2"; shift 2 ;;`)
      }
    }
    lines.push("        -h|--help) usage ;;")
    lines.push('        *) echo "Unknown option: $1"; usage ;;')
    lines.push("    esac")
    lines.push("done")
    lines.push("")

    for (const p of params) {
      if (p.required && p.type !== "boolean") {
        const varname = p.name.toUpperCase().replace(/-/g, "_")
        lines.push(`if [[ -z "\${${varname}:-}" ]]; then`)
        lines.push(`    echo "Error: --${p.name.replace(/_/g, "-")} is required"`)
        lines.push("    usage")
        lines.push("fi")
        lines.push("")
      }
    }
  }

  lines.push(`# TODO: implement ${name} logic`)
  lines.push("")
  lines.push("# Output JSON result")
  lines.push("{")
  lines.push(`  printf '{"ok": true, "tool": "${name}"'`)
  for (const p of params) {
    const v = p.name.toUpperCase().replace(/-/g, "_")
    if (p.type === "boolean") {
      lines.push(`  printf ', "${p.name}": %s' "\$${v}"`)
    } else if (p.type === "number") {
      lines.push(`  printf ', "${p.name}": %s' "$${v}"`)
    } else if (p.type === "array") {
      lines.push(`  printf ', "${p.name}": ['`)
      lines.push("  _first=true")
      lines.push(`  for _item in "\${${v}[@]}"; do`)
      lines.push('    $_first && _first=false || printf ", "')
      lines.push(`    printf '"%s"' "$_item"`)
      lines.push("  done")
      lines.push("  printf ']'")
    } else {
      lines.push(`  printf ', "${p.name}": "%s"' "$${v}"`)
    }
  }
  lines.push("  printf '}\\n'")
  lines.push("}")

  return lines.join("\n") + "\n"
}

function validateBash(content: string): string[] {
  const issues: string[] = []
  if (!content.includes("#!/usr/bin/env bash")) issues.push("Missing bash shebang")
  if (!content.includes("set -euo pipefail")) issues.push("Missing 'set -euo pipefail'")
  return issues
}

// ─── Output paths ──────────────────────────────────────────────────────

function getExt(language: Language): string {
  switch (language) {
    case "bash":
      return ".sh"
    default:
      return ".ts"
  }
}

function getOutputPath(name: string, scope: string, language: Language, projectRoot: string): string {
  if (language === "bash") {
    if (scope === "global") {
      const globalDir = process.env.OPENCODE_CONFIG_DIR || path.join(homedir(), ".config", "opencode")
      return path.join(globalDir, "skills", name, "scripts", `${name}.sh`)
    }
    return path.join(projectRoot, ".opencode", "skills", name, "scripts", `${name}.sh`)
  }

  // TypeScript tools are plugins in V2: one directory per tool under
  // `plugins/`, each with an `index.ts` that registers the tool. OpenCode 2
  // auto-discovers those directories, so the scaffolded tool works as-is.
  if (scope === "global") {
    const globalDir = process.env.OPENCODE_CONFIG_DIR || path.join(homedir(), ".config", "opencode")
    return path.join(globalDir, "plugins", name, "index.ts")
  }
  return path.join(projectRoot, ".opencode", "plugins", name, "index.ts")
}

// ─── Tool definition ───────────────────────────────────────────────────

const input = z.object({
  action: z.string().describe(`Action. Valid: ${VALID_ACTIONS.join(", ")}`),
  language: z.string().optional().describe(`Tool language. Valid: ${VALID_LANGUAGES.join(", ")}. Default: typescript`),
  name: z.string().optional().describe("Tool name in kebab-case (e.g. 'my-tool'). Required for generate."),
  description: z.string().optional().describe("Short description of what the tool does. Required for generate."),
  params: z.string().optional().describe("JSON array of parameter specs: [{name, type, required, description, enum?}]"),
  scope: z.string().optional().describe("'global' or 'project'. Default: project"),
  outputPath: z.string().optional().describe("Explicit output file path. Overrides scope/name/language."),
})

/** V2 tool results carry `{ content }`; this tool's payloads are JSON. */
const json = (value: unknown) => ({ content: JSON.stringify(value) })

export default {
  name: "tool-scaffolder",
  description:
    "Scaffold valid OpenCode 2 tool plugins in TypeScript or Bash. TypeScript tools become plugins under plugins/<name>/index.ts (auto-discovered, no registration wiring needed); Bash scripts go to skills/<name>/scripts/. Generates argument schemas, argument parsing, error handling, and handler stubs.",
  input,
  async execute(args, context) {
    const projectRoot = context.directory || process.cwd()
    const language: Language = (VALID_LANGUAGES as readonly string[]).includes(args.language || "")
      ? (args.language as Language)
      : "typescript"

    switch (args.action) {
      case "generate": {
        if (!args.name || !args.description) {
          return json({ error: "name and description required for generate action" })
        }

        const name = args.name.trim()
        if (!/^[a-z][a-z0-9-]*[a-z0-9]$/.test(name) && !/^[a-z]$/.test(name)) {
          return json({
            error: `Invalid tool name "${name}". Must be kebab-case (letters, digits, hyphens). Examples: "my-tool", "db-migrate".`,
          })
        }

        let params: ParamSpec[] = []
        if (args.params) {
          try {
            params = parseParams(args.params)
          } catch (e: any) {
            return json({ error: e.message })
          }
        }

        let outputPath: string
        if (args.outputPath) {
          outputPath = args.outputPath
        } else {
          outputPath = getOutputPath(name, args.scope || "project", language, projectRoot)
        }

        let code: string
        switch (language) {
          case "bash":
            code = generateBash(params, name, args.description)
            break
          default:
            code = generateTS(params, name, args.description)
        }

        const dir = path.dirname(outputPath)
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

        if (fs.existsSync(outputPath)) {
          return json({ error: `File already exists: ${outputPath}. Delete it first or use a different name.` })
        }

        fs.writeFileSync(outputPath, code, "utf-8")

        return json({
          ok: true,
          language,
          path: outputPath,
          scope: args.scope || "project",
          params: params.length,
          size: Buffer.byteLength(code, "utf-8"),
          note:
            language === "typescript"
              ? "OpenCode 2 auto-discovers this plugin directory — the tool is live on the next session start."
              : "Run it with the runSkillScript tool.",
        })
      }

      case "validate": {
        if (!args.outputPath) {
          return json({ error: "outputPath required for validate action" })
        }
        if (!fs.existsSync(args.outputPath)) {
          return json({ error: `File not found: ${args.outputPath}` })
        }

        const content = fs.readFileSync(args.outputPath, "utf-8")
        const ext = path.extname(args.outputPath)
        let issues: string[]

        switch (ext) {
          case ".sh":
            issues = validateBash(content)
            break
          default:
            issues = validateTS(content)
        }

        return json({ valid: issues.length === 0, issues, path: args.outputPath })
      }

      default:
        return json({ error: `Unknown action: ${args.action}. Valid: ${VALID_ACTIONS.join(", ")}` })
    }
  },
} satisfies ToolDefinition<z.infer<typeof input>>
