import * as fs from 'fs'
import * as path from 'path'
import { homedir } from 'os'

export interface ConfigRoot {
  /** Parsed JSON config */
  config: Record<string, unknown>
  /** The directory this config was loaded from */
  configDir: string
  /** The raw config file path */
  configPath: string
}

/**
 * Parse a JSONC string into a JS object.
 * Strips // line comments (preserving strings) and trailing commas.
 */
export function parseJsonc(raw: string): Record<string, unknown> {
  // Strip // line comments, respecting string boundaries
  const lines = raw.split('\n')
  const cleanedLines = lines.map((line) => {
    let inString = false
    let quoteChar: string | null = null
    let commentIdx = -1
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (inString) {
        if (ch === '\\') {
          i++
          continue
        } // skip escaped char
        if (ch === quoteChar) inString = false
      } else {
        if (ch === '"' || ch === "'") {
          inString = true
          quoteChar = ch
        } else if (ch === '/' && i + 1 < line.length && line[i + 1] === '/') {
          commentIdx = i
          break
        }
      }
    }
    return commentIdx >= 0 ? line.substring(0, commentIdx) : line
  })

  let jsonStr = cleanedLines.join('\n')
  // Strip trailing commas before ] or }
  jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1')
  return JSON.parse(jsonStr) as Record<string, unknown>
}

/**
 * Find and load opencode.json(c) from a directory.
 * Tries: opencode.jsonc → opencode.json → .opencode/opencode.jsonc → .opencode/opencode.json
 */
export function findConfig(dir: string): string | null {
  const candidates = [
    path.join(dir, 'opencode.jsonc'),
    path.join(dir, 'opencode.json'),
    path.join(dir, '.opencode', 'opencode.jsonc'),
    path.join(dir, '.opencode', 'opencode.json'),
  ]
  for (const c of candidates) {
    if (fs.existsSync(c)) return c
  }
  return null
}

/**
 * Load config from a directory. Returns parsed config, config dir, and config path.
 */
export function loadConfig(dir: string): ConfigRoot | null {
  const configPath = findConfig(dir)
  if (!configPath) return null
  const raw = fs.readFileSync(configPath, 'utf-8')
  const config = parseJsonc(raw)
  return { config, configDir: dir, configPath }
}

/**
 * Get the global OpenCode config directory.
 * Uses OPENCODE_CONFIG_DIR env var, falls back to ~/.config/opencode.
 */
export function getGlobalConfigDir(): string {
  return process.env.OPENCODE_CONFIG_DIR || path.join(homedir(), '.config', 'opencode')
}
