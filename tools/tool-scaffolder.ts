import { tool } from "@opencode-ai/plugin"
import * as fs from "fs"
import * as path from "path"
import { homedir } from "os"

const VALID_ACTIONS = ['generate', 'validate'] as const
const VALID_LANGUAGES = ['typescript', 'python', 'bash'] as const
type Language = typeof VALID_LANGUAGES[number]

// ─── ParamSpec ─────────────────────────────────────────────────────────

interface ParamSpec {
  name: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
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
      type: ['string', 'number', 'boolean', 'array', 'object'].includes(p.type) ? p.type : 'string',
      required: p.required !== false,
      description: p.description || p.name || `param${i + 1}`,
      enum: p.enum,
    }))
  } catch (e: any) {
    throw new Error(`Invalid params JSON: ${e.message}`)
  }
}

// ─── TypeScript generator ──────────────────────────────────────────────

function generateTS(params: ParamSpec[], name: string, description: string): string {
  const ifaceName = (name.charAt(0).toUpperCase() + name.slice(1)).replace(/-./g, m => m[1].toUpperCase()) + 'Args'
  const hasParams = params.length > 0

  const iface = hasParams ? `interface ${ifaceName} {
${params.map(p => `  ${p.name}${p.required ? '' : '?'}: ${p.type === 'array' ? 'string[]' : p.type}`).join('\n')}
}

` : ''

  const schema = hasParams
    ? `  args: {
${params.map(p => {
      let chain = `    ${p.name}: tool.schema.${p.type}()`
      if (!p.required) chain += '.optional()'
      chain += `.describe("${p.description.replace(/"/g, '\\"')}")`
      if (p.enum?.length) chain += `.enum([${p.enum.map(v => `"${v}"`).join(', ')}])`
      return chain + ','
    }).join('\n')}
  },`
    : '  args: {},'

  const handler = hasParams
    ? `  async execute(args: ${ifaceName}, context) {
    const projectRoot = context.directory || process.cwd()
    // TODO: implement tool logic
    return JSON.stringify({ ok: true, tool: "${name}" })
  },`
    : `  async execute(args, context) {
    const projectRoot = context.directory || process.cwd()
    // TODO: implement tool logic
    return JSON.stringify({ ok: true, tool: "${name}" })
  },`

  return `import { tool } from "@opencode-ai/plugin"
import * as fs from "fs"
import * as path from "path"
import { homedir } from "os"

${iface}export default tool({
  description: "${description.replace(/"/g, '\\"')}",
${schema}
${handler}
})
`
}

function validateTS(content: string): string[] {
  const issues: string[] = []
  if (!content.includes('import { tool } from')) issues.push("Missing import from @opencode-ai/plugin")
  if (!content.includes('export default tool(')) issues.push("Missing default tool export")
  if (!content.includes('description:')) issues.push("Missing description field")
  if (!content.includes('args:')) issues.push("Missing args schema")
  if (!content.includes('async execute')) issues.push("Missing async execute handler")
  return issues
}

// ─── Python generator ──────────────────────────────────────────────────

function generatePython(params: ParamSpec[], name: string, description: string): string {
  const lines: string[] = [
    '#!/usr/bin/env python3',
    `"""${description}"""`,
    'import argparse',
    'import json',
    'import sys',
    'import os',
    '',
    '',
    'def main():',
    `    parser = argparse.ArgumentParser(description="${description.replace(/"/g, '\\"')}")`,
  ]

  for (const p of params) {
    const flag = `--${p.name.replace(/_/g, '-')}`
    let arg = `    parser.add_argument("${flag}"`
    if (p.type === 'boolean') {
      arg += `, action="store_true"`
    } else {
      arg += `, type=${p.type === 'number' ? 'float' : 'str'}`
    }
    if (p.required && p.type !== 'boolean') arg += ', required=True'
    arg += `, help="${p.description.replace(/"/g, '\\"')}"`
    if (p.enum?.length) arg += `, choices=[${p.enum.map(v => `"${v}"`).join(', ')}]`
    arg += ')'
    lines.push(arg)
  }

  lines.push('')
  lines.push('    args = parser.parse_args()')
  lines.push('')
  lines.push(`    # TODO: implement ${name} logic`)
  lines.push('    result = {"ok": True}')

  if (params.length > 0) {
    for (const p of params) {
      lines.push(`    result["${p.name}"] = args.${p.name.replace(/-/g, '_')}`)
    }
  }

  lines.push('    print(json.dumps(result, indent=2))')
  lines.push('')
  lines.push('')
  lines.push('if __name__ == "__main__":')
  lines.push('    main()')

  return lines.join('\n') + '\n'
}

function validatePython(content: string): string[] {
  const issues: string[] = []
  if (!content.includes('#!/usr/bin/env python3')) issues.push("Missing Python shebang")
  if (!content.includes('import argparse')) issues.push("Missing argparse import")
  if (!content.includes('def main()')) issues.push("Missing main() function")
  if (!content.includes('if __name__')) issues.push("Missing __name__ guard")
  return issues
}

// ─── Bash generator ────────────────────────────────────────────────────

function generateBash(params: ParamSpec[], name: string, description: string): string {
  const lines: string[] = [
    '#!/usr/bin/env bash',
    `# ${description}`,
    'set -euo pipefail',
    '',
    'usage() {',
    `  echo "Usage: $0 [OPTIONS]"`,
    '  echo ""',
    '  echo "Options:"',
  ]

  for (const p of params) {
    const flag = `--${p.name.replace(/_/g, '-')}`
    const req = p.required && p.type !== 'boolean' ? ' (required)' : ''
    const typeHint = p.type === 'boolean' ? 'flag' : `<${p.type === 'number' ? 'num' : 'str'}>`
    lines.push(`  echo "  ${flag} ${typeHint}${req}  ${p.description}"`)
  }

  lines.push('  exit 1')
  lines.push('}')
  lines.push('')

  // Declare variables
  for (const p of params) {
    const varname = p.name.toUpperCase().replace(/-/g, '_')
    if (p.type === 'boolean') {
      lines.push(`${varname}=false`)
    } else if (p.type === 'number') {
      lines.push(`${varname}=0`)
    } else if (p.type === 'array') {
      lines.push(`${varname}=()`)
    } else {
      lines.push(`${varname}=""`)
    }
  }
  lines.push('')

  // Argument parsing
  if (params.length > 0) {
    lines.push('while [[ $# -gt 0 ]]; do')
    lines.push('    case $1 in')
    for (const p of params) {
      const flag = `--${p.name.replace(/_/g, '-')}`
      const varname = p.name.toUpperCase().replace(/-/g, '_')
      if (p.type === 'boolean') {
        lines.push(`        ${flag}) ${varname}=true; shift ;;`)
      } else if (p.type === 'array') {
        lines.push(`        ${flag}) ${varname}+=("$2"); shift 2 ;;`)
      } else {
        lines.push(`        ${flag}) ${varname}="$2"; shift 2 ;;`)
      }
    }
    lines.push('        -h|--help) usage ;;')
    lines.push('        *) echo "Unknown option: $1"; usage ;;')
    lines.push('    esac')
    lines.push('done')
    lines.push('')

    // Required checks
    for (const p of params) {
      if (p.required && p.type !== 'boolean') {
        const varname = p.name.toUpperCase().replace(/-/g, '_')
        lines.push(`if [[ -z "\${${varname}:-}" ]]; then`)
        lines.push(`    echo "Error: --${p.name.replace(/_/g, '-')} is required"`)
        lines.push('    usage')
        lines.push('fi')
        lines.push('')
      }
    }
  }

  lines.push(`# TODO: implement ${name} logic`)
  lines.push('')
  lines.push('# Output JSON result')
  lines.push("{")
  lines.push(`  printf '{"ok": true, "tool": "${name}"'`)
  for (const p of params) {
    const v = p.name.toUpperCase().replace(/-/g, '_')
    if (p.type === 'boolean') {
      lines.push(`  printf ', "${p.name}": %s' "\$${v}"`)
    } else if (p.type === 'number') {
      lines.push(`  printf ', "${p.name}": %s' "$${v}"`)
    } else if (p.type === 'array') {
      lines.push(`  printf ', "${p.name}": ['`)
      lines.push('  _first=true')
      lines.push(`  for _item in "\${${v}[@]}"; do`)
      lines.push('    $_first && _first=false || printf ", "')
      lines.push('    printf \'"%s"\' "$_item"')
      lines.push('  done')
      lines.push("  printf ']'")
    } else {
      lines.push(`  printf ', "${p.name}": "%s"' "$${v}"`)
    }
  }
  lines.push("  printf '}\\n'")
  lines.push("}")

  return lines.join('\n') + '\n'
}

function validateBash(content: string): string[] {
  const issues: string[] = []
  if (!content.includes('#!/usr/bin/env bash')) issues.push("Missing bash shebang")
  if (!content.includes('set -euo pipefail')) issues.push("Missing 'set -euo pipefail'")
  return issues
}

// ─── Language-specific config ──────────────────────────────────────────

function getExt(language: Language): string {
  switch (language) {
    case 'python': return '.py'
    case 'bash': return '.sh'
    default: return '.ts'
  }
}

function getOutputPath(name: string, scope: string, language: Language, projectRoot: string): string {
  const ext = getExt(language)
  const file = `${name}${ext}`

  if (scope === 'global') {
    const globalDir = process.env.OPENCODE_CONFIG_DIR || path.join(homedir(), '.config', 'opencode')
    // TypeScript goes in tools/, Python/Bash go in skills/<name>/scripts/
    if (language === 'typescript') return path.join(globalDir, 'tools', file)
    return path.join(globalDir, 'skills', name, 'scripts', file)
  }

  // Project scope
  if (language === 'typescript') return path.join(projectRoot, '.opencode', 'tools', file)
  return path.join(projectRoot, '.opencode', 'skills', name, 'scripts', file)
}

// ─── Tool definition ───────────────────────────────────────────────────

export default tool({
  description: "Scaffold valid tool files for OpenCode in TypeScript, Python, or Bash. Generates correct boilerplate, argument parsing, error handling, and handler stubs. TypeScript tools go to tools/ or .opencode/tools/; Python and Bash scripts go to skills/<name>/scripts/.",
  args: {
    action: tool.schema.string().describe(`Action. Valid: generate, validate`),
    language: tool.schema.string().optional().describe(`Tool language. Valid: typescript, python, bash. Default: typescript`),
    name: tool.schema.string().optional().describe("Tool name in kebab-case (e.g. 'my-tool'). Required for generate."),
    description: tool.schema.string().optional().describe("Short description of what the tool does. Required for generate."),
    params: tool.schema.string().optional().describe("JSON array of parameter specs: [{name, type, required, description, enum?}]"),
    scope: tool.schema.string().optional().describe("'global' or 'project'. Default: project"),
    outputPath: tool.schema.string().optional().describe("Explicit output file path. Overrides scope/name/language."),
  },

  async execute(args, context) {
    const projectRoot = context.directory || process.cwd()
    const language: Language = (VALID_LANGUAGES as readonly string[]).includes(args.language || '')
      ? args.language as Language : 'typescript'

    switch (args.action) {
      case 'generate': {
        if (!args.name || !args.description) {
          return JSON.stringify({ error: "name and description required for generate action" })
        }

        const name = args.name.trim()
        if (!/^[a-z][a-z0-9-]*[a-z0-9]$/.test(name) && !/^[a-z]$/.test(name)) {
          return JSON.stringify({
            error: `Invalid tool name "${name}". Must be kebab-case (letters, digits, hyphens). Examples: "my-tool", "db-migrate".`,
          })
        }

        let params: ParamSpec[] = []
        if (args.params) {
          try { params = parseParams(args.params) }
          catch (e: any) { return JSON.stringify({ error: e.message }) }
        }

        let outputPath: string
        if (args.outputPath) {
          outputPath = args.outputPath
        } else {
          outputPath = getOutputPath(name, args.scope || 'project', language, projectRoot)
        }

        let code: string
        switch (language) {
          case 'python':
            code = generatePython(params, name, args.description)
            break
          case 'bash':
            code = generateBash(params, name, args.description)
            break
          default:
            code = generateTS(params, name, args.description)
        }

        const dir = path.dirname(outputPath)
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

        if (fs.existsSync(outputPath)) {
          return JSON.stringify({ error: `File already exists: ${outputPath}. Delete it first or use a different name.` })
        }

        fs.writeFileSync(outputPath, code, 'utf-8')

        return JSON.stringify({
          ok: true, language,
          path: outputPath,
          scope: args.scope || 'project',
          params: params.length,
          size: Buffer.byteLength(code, 'utf-8'),
        })
      }

      case 'validate': {
        if (!args.outputPath) {
          return JSON.stringify({ error: "outputPath required for validate action" })
        }
        if (!fs.existsSync(args.outputPath)) {
          return JSON.stringify({ error: `File not found: ${args.outputPath}` })
        }

        const content = fs.readFileSync(args.outputPath, 'utf-8')
        const ext = path.extname(args.outputPath)
        let issues: string[]

        switch (ext) {
          case '.py': issues = validatePython(content); break
          case '.sh': issues = validateBash(content); break
          default: issues = validateTS(content)
        }

        return JSON.stringify({ valid: issues.length === 0, issues, path: args.outputPath })
      }

      default:
        return JSON.stringify({ error: `Unknown action: ${args.action}. Valid: ${VALID_ACTIONS.join(', ')}` })
    }
  },
})
