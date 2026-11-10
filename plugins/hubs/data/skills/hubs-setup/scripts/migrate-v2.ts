#!/usr/bin/env bun
/**
 * migrate-v2 — rewrite an OpenCode 1 project for OpenCode 2.
 *
 * What V2's config normalizer CANNOT fix (this script's job):
 *
 *   1. File-based tool discovery — V2 removed it. `.opencode/tools/*.ts` is
 *      inert; a tool exists only when a plugin registers it through
 *      `ctx.tool.transform(editor => editor.add(...))`.
 *   2. Config plugin entries pointing at a FILE — V2 rejects them:
 *      "configured plugin path must be a directory".
 *
 * What the normalizer already handles (left alone by default):
 *
 *   provider → providers, permission map → permissions[], mcp map →
 *   mcp.servers, skills object → string[].
 *
 *   `--v2-native` rewrites those to the native V2 shape as well. That makes
 *   the project V2-only: OpenCode 1 refuses to start on a config with a
 *   `permissions[]` array.
 *
 * Usage:
 *   bun migrate-v2.ts [--project <dir>] [--dry-run] [--v2-native] [--force] [--json]
 */

import fs from "node:fs"
import path from "node:path"
import { parseTree, type Node } from "jsonc-parser"

// ─── Types ────────────────────────────────────────────────────────────────

interface Warning {
  target: string
  message: string
}

interface ToolMigration {
  source: string
  target: string
  name: string
  warnings: string[]
}

interface PluginMigration {
  source: string
  target: string
  name: string
}

interface ConfigChange {
  change: string
  detail: string
}

interface Report {
  project: string
  dryRun: boolean
  v2Native: boolean
  tools: ToolMigration[]
  plugins: PluginMigration[]
  config: ConfigChange[]
  warnings: Warning[]
}

// ─── CLI ───────────────────────────────────────────────────────────────────

interface Options {
  project: string
  dryRun: boolean
  v2Native: boolean
  force: boolean
  json: boolean
}

function parseArgs(argv: string[]): Options {
  const opts: Options = {
    project: process.cwd(),
    dryRun: false,
    v2Native: false,
    force: false,
    json: false,
  }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === "--project" || arg === "-p") opts.project = argv[++i] ?? opts.project
    else if (arg.startsWith("--project=")) opts.project = arg.slice("--project=".length)
    else if (arg === "--dry-run") opts.dryRun = true
    else if (arg === "--v2-native") opts.v2Native = true
    else if (arg === "--force") opts.force = true
    else if (arg === "--json") opts.json = true
    else if (arg === "--help" || arg === "-h") {
      console.log(
        [
          "migrate-v2 — rewrite an OpenCode 1 project for OpenCode 2",
          "",
          "  --project <dir>  project root (default: cwd)",
          "  --dry-run        report what would change, write nothing",
          "  --v2-native      also rewrite config keys to the native V2 shape",
          "  --force          overwrite existing plugin directories",
          "  --json           machine-readable report on stdout",
        ].join("\n"),
      )
      process.exit(0)
    }
  }
  return opts
}

// ─── Small source scanner ─────────────────────────────────────────────────
// A tolerant scanner good enough for tool definitions: it skips strings,
// template literals, comments, and tracks one bracket pair at a time.

function skipString(text: string, i: number): number {
  const quote = text[i]
  i++
  while (i < text.length) {
    const ch = text[i]
    if (ch === "\\") {
      i += 2
      continue
    }
    if (quote === "`" && ch === "$" && text[i + 1] === "{") {
      i = skipBalanced(text, i + 1)
      continue
    }
    if (ch === quote) return i + 1
    i++
  }
  return i
}

/** Index just past the bracket that closes the one at `i`. */
function skipBalanced(text: string, i: number): number {
  const open = text[i]
  const close = open === "{" ? "}" : open === "(" ? ")" : "]"
  let depth = 0
  while (i < text.length) {
    const ch = text[i]
    if (ch === '"' || ch === "'" || ch === "`") {
      i = skipString(text, i)
      continue
    }
    if (ch === "/" && text[i + 1] === "/") {
      const nl = text.indexOf("\n", i)
      i = nl === -1 ? text.length : nl
      continue
    }
    if (ch === "/" && text[i + 1] === "*") {
      const end = text.indexOf("*/", i + 2)
      i = end === -1 ? text.length : end + 2
      continue
    }
    if (ch === open) {
      depth++
      i++
      continue
    }
    if (ch === close) {
      depth--
      i++
      if (depth === 0) return i
      continue
    }
    i++
  }
  return i
}

function skipTrivia(text: string, i: number): number {
  while (i < text.length) {
    const ch = text[i]
    if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
      i++
      continue
    }
    if (ch === "/" && text[i + 1] === "/") {
      const nl = text.indexOf("\n", i)
      i = nl === -1 ? text.length : nl
      continue
    }
    if (ch === "/" && text[i + 1] === "*") {
      const end = text.indexOf("*/", i + 2)
      i = end === -1 ? text.length : end + 2
      continue
    }
    break
  }
  return i
}

interface Property {
  key: string
  /** Raw source of the property value (or the method source for shorthand). */
  value: string
  isMethod: boolean
}

/** Scan the object literal that starts at `objStart` for its properties. */
function scanProperties(text: string, objStart: number): Property[] {
  const props: Property[] = []
  let i = objStart + 1
  while (i < text.length) {
    i = skipTrivia(text, i)
    if (text[i] === "}") break
    if (text[i] === ",") {
      i++
      continue
    }

    let key: string
    let j: number

    if (text[i] === '"' || text[i] === "'" || text[i] === "`") {
      const keyEnd = skipString(text, i)
      key = text.slice(i + 1, keyEnd - 1)
      j = skipTrivia(text, keyEnd)
    } else if (/[A-Za-z0-9_$]/.test(text[i] ?? "")) {
      // Unquoted key (`name: "x"`) or method shorthand
      // (`async execute(args, ctx) { ... }`). The last identifier before
      // `(` or `:` is the key; earlier ones are modifiers.
      const tokens: string[] = []
      let k = i
      while (k < text.length) {
        k = skipTrivia(text, k)
        if (!/[A-Za-z0-9_$]/.test(text[k] ?? "")) break
        const start = k
        while (k < text.length && /[A-Za-z0-9_$]/.test(text[k])) k++
        tokens.push(text.slice(start, k))
      }
      if (text[k] !== "(" && text[k] !== ":") break
      key = tokens[tokens.length - 1] ?? ""
      j = k
    } else {
      // Not a property we understand — bail out rather than guess.
      break
    }

    if (text[j] === ":") {
      j = skipTrivia(text, j + 1)
      const valueStart = j
      // Read the value expression up to a top-level comma or the object's `}`.
      let depth = 0
      while (j < text.length) {
        const ch = text[j]
        if (ch === '"' || ch === "'" || ch === "`") {
          j = skipString(text, j)
          continue
        }
        if (ch === "/" && text[j + 1] === "/") {
          const nl = text.indexOf("\n", j)
          j = nl === -1 ? text.length : nl
          continue
        }
        if (ch === "/" && text[j + 1] === "*") {
          const end = text.indexOf("*/", j + 2)
          j = end === -1 ? text.length : end + 2
          continue
        }
        if (ch === "(" || ch === "[" || ch === "{") {
          depth++
          j++
          continue
        }
        if (ch === ")" || ch === "]" || ch === "}") {
          if (depth === 0) break
          depth--
          j++
          continue
        }
        if (ch === "," && depth === 0) break
        j++
      }
      props.push({ key, value: text.slice(valueStart, j).trim(), isMethod: false })
      i = j
      continue
    }
    // Method shorthand: `async execute(args, ctx) { ... }`
    const valueStart = i
    const paramsEnd = skipBalanced(text, j)
    const bodyStart = text.indexOf("{", paramsEnd)
    if (bodyStart === -1) break
    const valueEnd = skipBalanced(text, bodyStart)
    props.push({ key, value: text.slice(valueStart, valueEnd).trim(), isMethod: true })
    i = valueEnd
  }
  return props
}

function unquote(raw: string): string {
  const text = raw.trim()
  if (text.length >= 2) {
    const first = text[0]
    const last = text[text.length - 1]
    if ((first === '"' || first === "'" || first === "`") && first === last) {
      const inner = text.slice(1, -1)
      if (!inner.includes("${")) return inner.replace(/\\(["'`\\])/g, "$1")
    }
  }
  return ""
}

function indent(text: string, prefix: string): string {
  return text
    .split("\n")
    .map((line) => (line.trim().length ? prefix + line : line))
    .join("\n")
}

// ─── V1 tool parsing ──────────────────────────────────────────────────────

interface ParsedTool {
  name: string
  description: string
  args: string | null
  executeBody: string | null
  imports: string[]
  usesZod: boolean
}

const TOOL_IMPORT = /import\s+[^;]*?\bfrom\s*["'](@opencode-ai\/plugin|@opencode\/plugin)["']\s*;?/g

function parseTool(source: string, fallbackName: string): ParsedTool | null {
  const toolCall = source.match(/tool\s*\(\s*\{/)
  if (!toolCall || toolCall.index === undefined) return null
  const braceIndex = source.indexOf("{", toolCall.index)
  const objectEnd = skipBalanced(source, braceIndex)
  const props = scanProperties(source, braceIndex)
  const get = (key: string) => props.find((p) => p.key === key)

  const nameProp = get("name")
  const name = (nameProp ? unquote(nameProp.value) : "") || fallbackName

  const descProp = get("description")
  const description = descProp ? descProp.value.trim() : `"${name} tool"`

  const argsProp = get("args")
  const args = argsProp ? argsProp.value.trim() : null

  const execProp = get("execute")
  let executeBody: string | null = null
  if (execProp) {
    const raw = execProp.value
    const bodyStart = raw.indexOf("{")
    if (bodyStart !== -1) {
      const bodyEnd = skipBalanced(raw, bodyStart)
      executeBody = raw.slice(bodyStart + 1, bodyEnd - 1)
    } else {
      const arrow = raw.indexOf("=>")
      if (arrow !== -1) executeBody = `return (${raw.slice(arrow + 2).trim()})`
    }
  }

  const imports: string[] = []
  const importRe = /import\s+(?:[^;'"]*?\s+from\s+)?["'][^"']+["']\s*;?/g
  let match: RegExpExecArray | null
  while ((match = importRe.exec(source)) !== null) {
    if (TOOL_IMPORT.test(match[0])) {
      TOOL_IMPORT.lastIndex = 0
      continue
    }
    TOOL_IMPORT.lastIndex = 0
    imports.push(match[0].trim())
  }

  return {
    name,
    description,
    args,
    executeBody,
    imports,
    usesZod: !!args && /\bz\.(object|record|union|strictObject)\b/.test(args),
  }
}

// ─── V2 plugin generation ─────────────────────────────────────────────────

function buildInputSchema(parsed: ParsedTool, warnings: Warning[], target: string): string {
  const args = parsed.args
  if (!args || args === "{}") {
    return `const input = { type: "object", properties: {} }`
  }

  if (parsed.usesZod) {
    warnings.push({
      target,
      message:
        "args used a zod schema; the generated plugin converts it with `z.toJSONSchema` from `zod/v4`, which needs zod >= 3.25",
    })
    return [
      `const argsSchema = ${args}`,
      `const input = z.toJSONSchema(argsSchema, { io: "input", unrepresentable: "any" }) as Record<string, unknown>`,
    ].join("\n")
  }

  if (args.startsWith("{")) {
    const looksLikeJsonSchema = /"type"\s*:\s*"object"|type\s*:\s*"object"/.test(args)
    if (looksLikeJsonSchema) return `const input = ${args}`
    // A bare map of parameter name → schema.
    return `const input = { type: "object", properties: ${args} }`
  }

  warnings.push({
    target,
    message: `args (${args.slice(0, 60)}) is neither JSON Schema nor a zod schema — emitted an empty object schema; fill it in by hand`,
  })
  return `const input = { type: "object", properties: {} }`
}

function buildPluginSource(parsed: ParsedTool, original: string, target: string, warnings: Warning[]): string {
  const imports = parsed.imports.filter((line) => !/from\s*["']zod["']/.test(line))
  const needsZod = parsed.usesZod && !imports.some((line) => /from\s*["']zod\/v4["']/.test(line))

  const header = [
    "/**",
    ` * ${parsed.name} — migrated to OpenCode 2 by migrate-v2.`,
    " *",
    " * OpenCode 2 removed file-based tool discovery: a file under",
    " * `.opencode/tools/` is inert until a plugin registers it. This file is",
    " * that plugin — OpenCode 2 auto-discovers every directory under",
    " * `.opencode/plugins/` and loads its `index.ts`.",
    " */",
    "",
  ].join("\n")

  const importBlock = [...imports]
  if (needsZod) importBlock.push(`import { z } from "zod/v4"`)
  const importText = importBlock.length ? importBlock.join("\n") + "\n\n" : ""

  const inputText = buildInputSchema(parsed, warnings, target)

  const body = parsed.executeBody
  const executeText = body
    ? [
        "const originalExecute = async function (args: any, context: any) {",
        indent(body.trim(), "  "),
        "}",
      ].join("\n")
    : [
        "const originalExecute = async function (_args: any, _context: any) {",
        '  return "This tool had no execute handler in the V1 source — implement it."',
        "}",
      ].join("\n")

  if (!body) {
    warnings.push({ target, message: "no execute handler was found in the V1 source — the stub needs an implementation" })
  }

  const plugin = [
    "export default {",
    `  id: ${JSON.stringify(parsed.name)},`,
    "  setup(ctx: any) {",
    '    const directory: string = ctx?.location?.directory ?? process.cwd()',
    "",
    "    ctx.tool.transform((editor: any) => {",
    "      editor.add({",
    `        name: ${JSON.stringify(parsed.name)},`,
    `        description: ${parsed.description},`,
    "        input,",
    "        options: { codemode: false },",
    "        execute: async (args: any, context: any) => {",
    "          const result = await originalExecute(args, { ...context, directory: context?.directory ?? directory })",
    '          if (typeof result === "string") return { content: result }',
    '          if (result && typeof result === "object") return { content: JSON.stringify(result, null, 2) }',
    '          return { content: result === undefined ? "" : String(result) }',
    "        },",
    "      })",
    "    })",
    "  },",
    "}",
  ].join("\n")

  return `${header}${importText}${inputText}\n\n${executeText}\n\n${plugin}\n`
}

// ─── Config helpers (JSONC-aware, comment preserving) ─────────────────────

function nodeText(text: string, node: Node): string {
  return text.slice(node.offset, node.offset + node.length)
}

function replaceSpan(text: string, start: number, length: number, replacement: string): string {
  return text.slice(0, start) + replacement + text.slice(start + length)
}

interface PropertyNodes {
  /** The property node (`"key": value` as a whole). */
  property: Node
  /** The key node — its text is the quoted key. */
  key: Node
  /** The value node. */
  value: Node
}

/** Find a property of an object node by key. */
function findProperty(node: Node | undefined, key: string): PropertyNodes | undefined {
  if (!node || node.type !== "object" || !node.children) return undefined
  for (const property of node.children) {
    if (property.type !== "property" || !property.children) continue
    const keyNode = property.children[0]
    const valueNode = property.children[1]
    if (keyNode?.value === key) return { property, key: keyNode, value: valueNode }
  }
  return undefined
}

/** Apply a list of text replacements, right to left so offsets stay valid. */
function applyReplacements(
  text: string,
  edits: Array<{ start: number; length: number; replacement: string }>,
): string {
  return [...edits].sort((a, b) => b.start - a.start).reduce((acc, edit) => replaceSpan(acc, edit.start, edit.length, edit.replacement), text)
}

function normalizeAction(action: string): string {
  if (action === "write" || action === "patch") return "edit"
  if (action === "task") return "subagent"
  if (action === "bash") return "shell"
  return action
}

interface PermissionRule {
  action: string
  resource: string
  effect: string
}

function permissionMapToRules(value: Record<string, unknown>): PermissionRule[] {
  const rules: PermissionRule[] = []
  for (const [action, raw] of Object.entries(value)) {
    if (typeof raw === "string") {
      rules.push({ action: normalizeAction(action), resource: "*", effect: raw })
      continue
    }
    if (raw && typeof raw === "object") {
      for (const [resource, effect] of Object.entries(raw as Record<string, unknown>)) {
        if (typeof effect === "string") {
          rules.push({ action: normalizeAction(action), resource, effect })
        }
      }
    }
  }
  return rules
}

function migratePermissions(text: string, changes: ConfigChange[]): string {
  const root = parseTree(text)
  if (!root) return text
  const found = findProperty(root, "permission")
  if (!found || found.value.type !== "object") return text
  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(nodeText(text, found.value))
  } catch {
    changes.push({ change: "permission → permissions", detail: "skipped — the value is not plain JSON" })
    return text
  }
  const rules = permissionMapToRules(parsed)
  if (!rules.length) return text
  const serialized = JSON.stringify(rules, null, 2)
    .split("\n")
    .map((line, index) => (index === 0 ? line : "  " + line))
    .join("\n")
  const out = applyReplacements(text, [
    { start: found.key.offset, length: found.key.length, replacement: '"permissions"' },
    { start: found.value.offset, length: found.value.length, replacement: serialized },
  ])
  changes.push({ change: "permission → permissions", detail: `${rules.length} rule(s) converted to the V2 array shape` })
  return out
}

function migrateMcp(text: string, changes: ConfigChange[]): string {
  const root = parseTree(text)
  if (!root) return text
  const found = findProperty(root, "mcp")
  if (!found || found.value.type !== "object") return text
  if (findProperty(found.value, "servers")) return text

  const edits: Array<{ start: number; length: number; replacement: string }> = []
  let touched = 0

  for (const server of found.value.children ?? []) {
    if (server.type !== "property" || !server.children) continue
    const serverValue = server.children[1]
    if (serverValue.type !== "object") continue

    // V1 `enabled` becomes V2 `disabled` (inverted).
    const enabled = findProperty(serverValue, "enabled")
    if (enabled) {
      const enabledValue = enabled.value.value === true
      edits.push({
        start: enabled.property.offset,
        length: enabled.property.length,
        replacement: `"disabled": ${enabledValue ? "false" : "true"}`,
      })
      touched++
    }

    // A local server needs an explicit `type` in the V2 schema.
    if (!findProperty(serverValue, "type") && findProperty(serverValue, "command")) {
      edits.push({
        start: serverValue.offset,
        length: 1,
        replacement: '{ "type": "local",',
      })
      touched++
    }
  }

  let out = applyReplacements(text, edits)
  const innerEnd = skipBalanced(out, found.value.offset) - 1
  const inner = out.slice(found.value.offset + 1, innerEnd).trim()
  if (!inner) return text
  const indented = inner
    .split("\n")
    .map((line) => (line.trim().length ? "    " + line : line))
    .join("\n")
  out = replaceSpan(out, found.value.offset, innerEnd + 1 - found.value.offset, `{\n  "servers": {\n${indented}\n  }\n}`)
  changes.push({
    change: "mcp → mcp.servers",
    detail: touched ? `servers moved under the V2 \`servers\` key (${touched} field(s) adjusted)` : "servers moved under the V2 `servers` key",
  })
  return out
}

function migrateSkills(text: string, changes: ConfigChange[]): string {
  const root = parseTree(text)
  if (!root) return text
  const found = findProperty(root, "skills")
  if (!found) return text
  if (found.value.type === "array") return text
  if (found.value.type !== "object") return text
  const paths = findProperty(found.value, "paths")
  const urls = findProperty(found.value, "urls")
  const parts: string[] = []
  if (paths && paths.value.type === "array") parts.push(nodeText(text, paths.value).slice(1, -1).trim())
  if (urls && urls.value.type === "array") parts.push(nodeText(text, urls.value).slice(1, -1).trim())
  if (!parts.length || parts.some((part) => !part)) return text
  const out = replaceSpan(text, found.value.offset, found.value.length, `[${parts.join(", ")}]`)
  changes.push({ change: "skills → string[]", detail: "paths/urls flattened into the V2 native array" })
  return out
}

/** Drop config plugin entries that point at a file, returning the new text. */
function stripFilePluginEntries(text: string, configDir: string, report: Report, opts: Options): string {
  let out = text
  for (const key of ["plugin", "plugins"]) {
    // Re-parse for every key: the previous iteration may have shifted offsets.
    const root = parseTree(out)
    if (!root) return out
    const found = findProperty(root, key)
    if (!found || found.value.type !== "array") continue
    const raw = nodeText(out, found.value)
    let entries: unknown[]
    try {
      entries = JSON.parse(raw)
    } catch {
      continue
    }
    const kept: unknown[] = []
    let removed = 0
    for (const entry of entries) {
      if (typeof entry !== "string") {
        kept.push(entry)
        continue
      }
      const resolved = path.resolve(configDir, entry)
      let isFile = false
      try {
        isFile = fs.statSync(resolved).isFile()
      } catch {
        isFile = false
      }
      if (!isFile) {
        kept.push(entry)
        continue
      }
      removed++
      const name = path.basename(resolved).replace(/\.(ts|js|mjs|cjs)$/, "")
      const source = fs.readFileSync(resolved, "utf8")
      const alreadyV2 = /export\s+default\s*\{[^}]*\bid\s*:/.test(source) && /\bsetup\s*\(/.test(source)
      if (alreadyV2) {
        const target = path.join(configDir, "plugins", name, "index.ts")
        report.plugins.push({ source: path.relative(report.project, resolved), target: path.relative(report.project, target), name })
        if (!opts.dryRun) {
          fs.mkdirSync(path.dirname(target), { recursive: true })
          fs.copyFileSync(resolved, target)
        }
      } else {
        report.warnings.push({
          target: path.relative(report.project, resolved),
          message:
            "a V1 plugin file was found in the config. V2 rejects config plugin entries that point at a file, and a V1 plugin body needs a manual port — see the V1 → V2 hook mapping in plugins/hooks/index.ts",
        })
      }
    }
    if (!removed) continue
    const serialized = JSON.stringify(kept, null, 2)
      .split("\n")
      .map((line, index) => (index === 0 ? line : "  " + line))
      .join("\n")
    out = replaceSpan(out, found.value.offset, found.value.length, serialized)
    report.config.push({
      change: `${key}[]`,
      detail: `${removed} file entry/entries removed — V2 only accepts plugin directories`,
    })
  }
  return out
}

// ─── Migration steps ──────────────────────────────────────────────────────

function findProjectRoot(start: string): string {
  let dir = path.resolve(start)
  for (;;) {
    if (fs.existsSync(path.join(dir, ".git")) || fs.existsSync(path.join(dir, ".opencode"))) return dir
    const parent = path.dirname(dir)
    if (parent === dir) return path.resolve(start)
    dir = parent
  }
}

function listToolFiles(root: string): string[] {
  const dirs = [path.join(root, ".opencode", "tools"), path.join(root, ".opencode", "tool")]
  const files: string[] = []
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue
    for (const entry of fs.readdirSync(dir)) {
      if (!entry.endsWith(".ts") || entry.endsWith(".d.ts")) continue
      files.push(path.join(dir, entry))
    }
  }
  return files
}

function migrateTools(root: string, report: Report, opts: Options): void {
  for (const file of listToolFiles(root)) {
    const source = fs.readFileSync(file, "utf8")
    const fallback = path.basename(file).replace(/\.ts$/, "")
    const parsed = parseTool(source, fallback)
    const relativeSource = path.relative(root, file)

    if (!parsed) {
      report.warnings.push({
        target: relativeSource,
        message:
          "not a V1 `tool({ ... })` definition — OpenCode 2 will not load this file; port it by hand into .opencode/plugins/<name>/index.ts",
      })
      continue
    }

    const target = path.join(root, ".opencode", "plugins", parsed.name, "index.ts")
    if (fs.existsSync(target) && !opts.force) {
      report.warnings.push({
        target: path.relative(root, target),
        message: "a plugin with this name already exists — rerun with --force to overwrite",
      })
      continue
    }

    const warnings: Warning[] = []
    const plugin = buildPluginSource(parsed, source, path.relative(root, target), warnings)
    report.tools.push({
      source: relativeSource,
      target: path.relative(root, target),
      name: parsed.name,
      warnings: warnings.map((w) => w.message),
    })
    report.warnings.push(...warnings)

    if (!opts.dryRun) {
      fs.mkdirSync(path.dirname(target), { recursive: true })
      fs.writeFileSync(target, plugin, "utf8")
      fs.rmSync(file, { force: true })
    }
  }
}

function migrateConfig(root: string, report: Report, opts: Options): void {
  const candidates = [
    path.join(root, ".opencode", "opencode.jsonc"),
    path.join(root, ".opencode", "opencode.json"),
    path.join(root, "opencode.jsonc"),
    path.join(root, "opencode.json"),
  ]
  for (const configPath of candidates) {
    if (!fs.existsSync(configPath)) continue
    const original = fs.readFileSync(configPath, "utf8")
    let text = original
    const changes: ConfigChange[] = []

    text = stripFilePluginEntries(text, path.dirname(configPath), report, opts)

    if (opts.v2Native) {
      text = migratePermissions(text, changes)
      text = migrateMcp(text, changes)
      text = migrateSkills(text, changes)
    }

    if (text === original) continue
    report.config.push(...changes.map((c) => ({ ...c, detail: `${c.detail} (${path.relative(root, configPath)})` })))
    if (!opts.dryRun) fs.writeFileSync(configPath, text, "utf8")
  }
}

// ─── Report ───────────────────────────────────────────────────────────────

function printReport(report: Report): void {
  const lines: string[] = []
  lines.push("")
  lines.push(`OpenCode 2 migration — ${report.project}`)
  lines.push(report.dryRun ? "(dry run — nothing was written)" : "")
  lines.push("")
  lines.push("Tools")
  if (!report.tools.length) lines.push("  (none found)")
  for (const tool of report.tools) {
    lines.push(`  ✓ ${tool.name}: ${tool.source} → ${tool.target}`)
    for (const warning of tool.warnings) lines.push(`      ⚠ ${warning}`)
  }
  lines.push("")
  lines.push("Plugin entries")
  if (!report.plugins.length) lines.push("  (none found)")
  for (const plugin of report.plugins) lines.push(`  ✓ ${plugin.name}: ${plugin.source} → ${plugin.target}`)
  lines.push("")
  lines.push("Config")
  if (!report.config.length) lines.push("  (no changes)")
  for (const change of report.config) lines.push(`  ✓ ${change.change} — ${change.detail}`)
  lines.push("")
  lines.push("Needs manual work")
  if (!report.warnings.length) lines.push("  (none)")
  for (const warning of report.warnings) lines.push(`  ⚠ ${warning.target}: ${warning.message}`)
  lines.push("")
  if (!report.v2Native) {
    lines.push("Config keys left in the V1 shape on purpose — V2 migrates them automatically:")
    lines.push("  provider → providers, permission → permissions[], mcp → mcp.servers, skills → string[]")
    lines.push("Pass --v2-native to rewrite them to the native V2 shape (that makes the project V2-only).")
    lines.push("")
  }
  lines.push("Verify with: opencode2 plugin list")
  lines.push("")
  console.log(lines.join("\n"))
}

// ─── Main ─────────────────────────────────────────────────────────────────

function main(): void {
  const opts = parseArgs(process.argv.slice(2))
  const root = findProjectRoot(opts.project)
  const report: Report = {
    project: root,
    dryRun: opts.dryRun,
    v2Native: opts.v2Native,
    tools: [],
    plugins: [],
    config: [],
    warnings: [],
  }

  migrateTools(root, report, opts)
  migrateConfig(root, report, opts)

  if (opts.json) {
    console.log(JSON.stringify(report, null, 2))
    return
  }
  printReport(report)
}

if (import.meta.main) main()

export { parseTool, scanProperties, buildPluginSource, migratePermissions, migrateMcp, migrateSkills }
