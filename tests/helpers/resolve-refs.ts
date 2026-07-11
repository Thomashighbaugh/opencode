import * as fs from 'fs'
import * as path from 'path'
import { getGlobalConfigDir } from './load-config'

export type RefType = 'agent' | 'skill' | 'tool' | 'command' | 'rule' | 'plugin'

/** Maps ref type to relative path under config root */
function refTypeToPath(type: RefType): string {
  switch (type) {
    case 'agent':
      return 'agents'
    case 'skill':
      return 'skills'
    case 'tool':
      return 'tools'
    case 'command':
      return 'commands'
    case 'rule':
      return 'rules'
    case 'plugin':
      return ''
  }
}

/** Expected file extension for a given ref type */
function refTypeExtension(type: RefType): string {
  switch (type) {
    case 'agent':
    case 'rule':
      return '.md'
    case 'skill':
      return '/SKILL.md'
    case 'tool':
    case 'plugin':
      return ''
    case 'command':
      return '.md'
  }
}

/**
 * Check if a path exists relative to a config root directory.
 */
export function pathExistsInConfigRoot(configRoot: string, relativePath: string): boolean {
  return fs.existsSync(path.join(configRoot, relativePath))
}

/**
 * Resolve a reference of a given type to a file path.
 * Checks project-level .opencode/ first, then global config dir.
 * Returns the first found path, or null if not found anywhere.
 *
 * @param type - The reference type
 * @param name - The reference name (e.g. 'hubs', 'executor', 'verify')
 * @param projectRoot - The project root directory (with .opencode/)
 * @param globalConfigDir - Override global config dir (defaults to getGlobalConfigDir())
 */
export function resolveRef(
  type: RefType,
  name: string,
  projectRoot: string,
  globalConfigDir?: string,
): string | null {
  const baseDir = refTypeToPath(type)
  const ext = refTypeExtension(type)

  // For skills and commands, the name IS the file path
  let relative: string
  if (type === 'skill') {
    relative = path.join(baseDir, name, 'SKILL.md')
  } else if (type === 'tool') {
    relative = path.join(baseDir, `${name}.ts`)
  } else {
    relative = path.join(baseDir, `${name}${ext}`)
  }

  const global = globalConfigDir || getGlobalConfigDir()

  // Check project-level .opencode/ first
  const projectPath = path.join(projectRoot, '.opencode', relative)
  if (fs.existsSync(projectPath)) {
    return projectPath
  }

  // Then global config dir
  const globalPath = path.join(global, relative)
  if (fs.existsSync(globalPath)) {
    return globalPath
  }

  return null
}

/**
 * Resolve an instructions file reference (relative path from opencode.jsonc instructions[]).
 * These are relative to the config root where opencode.jsonc lives.
 */
export function resolveInstruction(instPath: string, configDir: string, globalDir?: string): string | null {
  const global = globalDir || getGlobalConfigDir()

  // Check config dir first
  const configRelative = path.resolve(configDir, instPath)
  if (fs.existsSync(configRelative)) {
    return configRelative
  }

  // Then global
  const globalRelative = path.resolve(global, instPath)
  if (fs.existsSync(globalRelative)) {
    return globalRelative
  }

  return null
}

/**
 * Resolve a plugin path (from plugin[] in opencode.jsonc).
 */
export function resolvePlugin(pluginPath: string, configDir: string, globalDir?: string): string | null {
  const global = globalDir || getGlobalConfigDir()

  // If it's an npm package starting with @, skip file check
  if (pluginPath.startsWith('@')) {
    return pluginPath // treat as resolved
  }

  // Check relative to config dir
  const configRelative = path.resolve(configDir, pluginPath)
  if (fs.existsSync(configRelative)) {
    return configRelative
  }

  // Check relative to global
  const globalRelative = path.resolve(global, pluginPath)
  if (fs.existsSync(globalRelative)) {
    return globalRelative
  }

  return null
}

/**
 * Scan a directory for all entity files of a given type.
 * Returns an array of { name, path } pairs.
 */
export function scanEntities(
  type: RefType,
  configRoot: string,
): Array<{ name: string; path: string }> {
  const baseDir = refTypeToPath(type)
  const dir = path.join(configRoot, baseDir)

  if (!fs.existsSync(dir)) return []

  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const results: Array<{ name: string; path: string }> = []

  for (const entry of entries) {
    if (type === 'skill' && entry.isDirectory()) {
      const skillPath = path.join(dir, entry.name, 'SKILL.md')
      if (fs.existsSync(skillPath)) {
        results.push({ name: entry.name, path: skillPath })
      }
    } else if (type !== 'skill' && entry.isFile() && entry.name.endsWith('.md')) {
      const name = entry.name.replace(/\.md$/, '')
      results.push({ name, path: path.join(dir, entry.name) })
    }
  }

  return results
}
