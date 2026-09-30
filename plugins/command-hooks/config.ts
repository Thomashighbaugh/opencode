/**
 * command-hooks/config.ts — where hooks come from, and which one wins.
 *
 * Three sources, in increasing precedence:
 *   1. ~/.config/opencode/command-hooks.jsonc   (global)
 *   2. <project>/.opencode/command-hooks.jsonc   (project, searched upward)
 *   3. `hooks:` in an agent's markdown frontmatter (per-agent)
 *
 * Each source is validated on its own. An invalid source is dropped with an
 * error message; it never takes the other sources down with it.
 */

import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { validateConfig } from './schema.js'
import type {
  CommandHooksConfig,
  ResolvedConfig,
  SessionHook,
  ToolHook,
} from './types.js'

export const GLOBAL_CONFIG_NAME = 'command-hooks.jsonc'
export const PROJECT_CONFIG_DIR = '.opencode'
export const PROJECT_CONFIG_NAME = 'command-hooks.jsonc'

export const DEFAULT_TRUNCATION_LIMIT = 30_000
/** LOCAL: the rendered injection is trimmed to roughly a paragraph of context. */
export const DEFAULT_INJECT_LIMIT = 4_000

/**
 * Strip comments and trailing commas from a JSONC document.
 *
 * Hand-rolled rather than pulled from a dependency because this runs inside a
 * plugin: a config file must not be able to fail to load just because an
 * optional parser is missing. Handles `//` and `/* *\/` comments outside strings
 * and trailing commas before `}` or `]`. The result is handed to `JSON.parse`,
 * so only standard JSON strings are accepted — single quotes are not a thing
 * here.
 */
export function parseJsonc(text: string): unknown {
  let out = ''
  let inString = false
  let quote = ''
  let inLine = false
  let inBlock = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    const next = text[i + 1]

    if (inLine) {
      if (c === '\n') { inLine = false; out += c }
      continue
    }
    if (inBlock) {
      if (c === '*' && next === '/') { inBlock = false; i++ } else if (c === '\n') out += c
      continue
    }
    if (inString) {
      out += c
      if (c === '\\') { out += next ?? ''; i++; continue }
      if (c === quote) inString = false
      continue
    }
    // Only a double quote opens a string. Single quotes are not valid JSON, and
    // treating `'` as a delimiter meant an apostrophe inside a `//` comment
    // swallowed the rest of the file as a string.
    if (c === '"') { inString = true; quote = c; out += c; continue }
    if (c === '/' && next === '/') { inLine = true; i++; continue }
    if (c === '/' && next === '*') { inBlock = true; i++; continue }
    out += c
  }

  // Trailing commas: a comma followed only by whitespace then a closer.
  out = out.replace(/,(\s*[}\]])/g, '$1')
  return JSON.parse(out)
}

export interface LoadResult {
  config: ResolvedConfig
  /** Per-source problems, surfaced once so a broken file is visible not silent. */
  errors: string[]
  sources: string[]
}

const EMPTY: CommandHooksConfig = { tool: [], session: [] }

function readJsonc(file: string, errors: string[]): CommandHooksConfig | null {
  if (!fs.existsSync(file)) return null
  try {
    const raw = parseJsonc(fs.readFileSync(file, 'utf-8'))
    const { config, error } = validateConfig(raw)
    if (error) {
      errors.push(`${file}: ${error}`)
      return null
    }
    return config ?? null
  } catch (e) {
    errors.push(`${file}: ${e instanceof Error ? e.message : String(e)}`)
    return null
  }
}

/** Walk up from `dir` looking for `.opencode/command-hooks.jsonc`. */
export function findProjectConfig(dir: string | undefined): string | null {
  if (!dir) return null
  let current = path.resolve(dir)
  for (let i = 0; i < 12; i++) {
    const candidate = path.join(current, PROJECT_CONFIG_DIR, PROJECT_CONFIG_NAME)
    if (fs.existsSync(candidate)) return candidate
    const parent = path.dirname(current)
    if (parent === current) break
    current = parent
  }
  return null
}

export function globalConfigPath(): string {
  return path.join(process.env.OPENCODE_CONFIG_DIR || path.join(os.homedir(), '.config', 'opencode'), GLOBAL_CONFIG_NAME)
}

/**
 * Parse the `hooks:` block out of an agent's markdown frontmatter.
 *
 * Frontmatter is real YAML, so it is parsed by the same `js-yaml` this
 * configuration's own `yaml-edit` tool already depends on, and the resulting
 * `hooks` value is handed to the same validator the JSONC files use — one
 * validation path, not two that can quietly disagree.
 *
 * The earlier version of this function hand-rolled a YAML subset. It was wrong:
 * a nested `toast:` block under a list item needs a second level of indentation
 * tracking, and the subset parser flattened it, so a perfectly valid agent
 * frontmatter silently produced a hook with no message. Depending on a parser
 * that is already present is both shorter and correct.
 */
export function parseAgentHooks(frontmatter: string): CommandHooksConfig | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const yaml = require('js-yaml')
    const doc = yaml.load(frontmatter)
    if (!doc || typeof doc !== 'object') return null
    const hooks = (doc as Record<string, unknown>).hooks
    if (!hooks || typeof hooks !== 'object') return null

    // `before`/`after` are the frontmatter spelling of the tool phase, and
    // frontmatter hooks are scoped to the agent whose file declared them, so
    // `callingAgent` defaults to that agent rather than matching everything.
    const tool: ToolHook[] = []
    for (const [phase, list] of [
      ['before', (hooks as any).before],
      ['after', (hooks as any).after],
    ] as const) {
      if (!Array.isArray(list)) continue
      list.forEach((entry, i) => {
        if (!entry || typeof entry !== 'object') return
        const id = `agent:${agentNameFromFrontmatter(frontmatter) || 'frontmatter'}:${phase}:${i}`
        tool.push({
          id,
          when: { phase, tool: '*', ...(entry.when ?? {}) },
          ...entry,
        } as ToolHook)
      })
    }
    const { config, error } = validateConfig({ tool })
    if (error) return null
    return config
  } catch {
    return null
  }
}

/** Best-effort `name:` from frontmatter, used only to namespace generated ids. */
function agentNameFromFrontmatter(frontmatter: string): string | null {
  const m = /^name\s*:\s*["']?([^"'\n]+)["']?\s*$/m.exec(frontmatter)
  return m ? m[1].trim() : null
}

/**
 * Read every source for a project.
 *
 * `ignoreGlobalConfig` in the project file is honoured even when the project
 * file is otherwise valid — the switch has to work, so it is applied from the
 * raw read before merging rather than as part of the merge.
 */
export function loadConfig(projectDir: string | undefined): LoadResult {
  const errors: string[] = []
  const sources: string[] = []

  const globalFile = globalConfigPath()
  const projectFile = findProjectConfig(projectDir)
  const globalCfg = readJsonc(globalFile, errors)
  if (globalCfg) sources.push(globalFile)

  const projectCfg = projectFile ? readJsonc(projectFile, errors) : null
  if (projectCfg && projectFile) sources.push(projectFile)

  const merged = mergeConfigs(globalCfg ?? EMPTY, projectCfg ?? EMPTY, projectCfg?.ignoreGlobalConfig === true)

  return {
    config: {
      truncationLimit: merged.truncationLimit ?? DEFAULT_TRUNCATION_LIMIT,
      injectLimit: merged.injectLimit ?? DEFAULT_INJECT_LIMIT,
      ignoreGlobalConfig: merged.ignoreGlobalConfig,
      tool: merged.tool ?? [],
      session: merged.session ?? [],
    },
    errors,
    sources,
  }
}

export interface MergedLists {
  tool: ToolHook[]
  session: SessionHook[]
  truncationLimit?: number
  injectLimit?: number
  ignoreGlobalConfig?: boolean
}

/**
 * Merge global and project hook lists.
 *
 * Same id → project wins. Different ids → both, global first, so a project's
 * hook reports after the inherited one it is layered on top of.
 */
export function mergeConfigs(
  globalCfg: CommandHooksConfig,
  projectCfg: CommandHooksConfig,
  ignoreGlobal = false,
): MergedLists {
  const pick = <T extends { id: string }>(g: T[] = [], p: T[] = []): T[] => {
    if (ignoreGlobal) return [...p]
    const byId = new Map<string, T>()
    for (const h of g) byId.set(h.id, h)
    for (const h of p) byId.set(h.id, h) // project replaces on id collision
    return [...byId.values()]
  }

  return {
    tool: pick(globalCfg.tool, projectCfg.tool),
    session: pick(globalCfg.session, projectCfg.session),
    // Project wins on scalars when set; otherwise the global value stands.
    truncationLimit: projectCfg.truncationLimit ?? globalCfg.truncationLimit,
    injectLimit: projectCfg.injectLimit ?? globalCfg.injectLimit,
    ignoreGlobalConfig: projectCfg.ignoreGlobalConfig ?? globalCfg.ignoreGlobalConfig,
  }
}

/**
 * Load the agent-markdown hooks for a subagent name, if that agent defines any.
 * The project copy of the agent directory is searched first so a project's
 * override beats the global one.
 */
export function loadAgentHooks(agentName: string, projectDir: string | undefined): CommandHooksConfig | null {
  const roots = [
    projectDir ? path.join(path.resolve(projectDir), 'agents') : null,
    path.join(process.env.OPENCODE_CONFIG_DIR || path.join(os.homedir(), '.config', 'opencode'), 'agents'),
  ].filter((r): r is string => Boolean(r))

  for (const root of roots) {
    for (const ext of ['.md', '.markdown']) {
      const file = path.join(root, agentName.replace(/^@/, '') + ext)
      if (!fs.existsSync(file)) continue
      try {
        const text = fs.readFileSync(file, 'utf-8')
        const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)
        if (!m) return null
        return parseAgentHooks(m[1])
      } catch {
        return null
      }
    }
  }
  return null
}
