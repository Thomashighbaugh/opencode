/**
 * auto-continue/core.ts — pure config and error-matching logic.
 *
 * Kept separate from the plugin entry so tests can import it without the
 * OpenCode loader mistaking a helper export for a plugin factory.
 */

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export interface AutoContinueConfig {
  enabled: boolean
  /** Provider IDs this applies to. Empty disables the plugin. */
  providers: string[]
  /** Minimum ms between auto-continues for one session. */
  throttleMs: number
  /** Delay after session.idle before sending continue. */
  delayMs: number
  /** Max consecutive auto-continues per session (0 = unlimited). */
  maxConsecutive: number
  errorPatterns: string[]
  excludePatterns: string[]
}

/** Matched case-insensitively against `"ErrorName: message"`. */
export const DEFAULT_ERROR_PATTERNS: string[] = [
  // API / provider errors
  'bad request',
  'reasoning_opaque',
  'prefill',
  'SSE read timed out',
  'DecimalError',
  // Context / compaction errors
  'ContextOverflowError',
  'too large to compact',
  // Tool execution errors
  'Invalid diff',
  'Tool execution aborted',
  'JSON parsing failed',
  'Invalid input for tool',
  'tried to call unavailable tool',
  'finding less tool calls',
  'tool_use ids were found without tool_result',
  // Connection errors (mid-stream)
  'ECONNREFUSED',
  'ECONNRESET',
  // Stream / timeout errors
  'idle timeout',
  'no data received',
  // Type / validation errors
  'expected string, received undefined',
]

/** Checked before match patterns — a hit here is never retried. */
export const DEFAULT_EXCLUDE_PATTERNS: string[] = [
  'MessageAbortedError',
  'operation was aborted',
]

export const DEFAULT_CONFIG: AutoContinueConfig = {
  enabled: true,
  providers: ['profundo'],
  throttleMs: 5_000,
  delayMs: 500,
  maxConsecutive: 5,
  errorPatterns: DEFAULT_ERROR_PATTERNS,
  excludePatterns: DEFAULT_EXCLUDE_PATTERNS,
}

export const CONFIG_RELATIVE_PATH = join('.opencode', 'auto-continue.jsonc')

/** Minimal JSONC strip: line/block comments and trailing commas, string-aware. */
export function parseJsonc(text: string): unknown {
  let result = ''
  let inString = false
  let stringChar = ''
  let i = 0

  while (i < text.length) {
    if (inString) {
      if (text[i] === '\\' && i + 1 < text.length) {
        result += text[i] + text[i + 1]
        i += 2
        continue
      }
      if (text[i] === stringChar) inString = false
      result += text[i]
      i++
      continue
    }

    if (text[i] === '"' || text[i] === "'") {
      inString = true
      stringChar = text[i]
      result += text[i]
      i++
    } else if (text[i] === '/' && text[i + 1] === '/') {
      while (i < text.length && text[i] !== '\n') i++
    } else if (text[i] === '/' && text[i + 1] === '*') {
      i += 2
      while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++
      i += 2
    } else {
      result += text[i]
      i++
    }
  }

  return JSON.parse(result.replace(/,\s*([}\]])/g, '$1'))
}

/** Merge parsed user config over the defaults. Unknown/invalid fields are ignored. */
export function mergeConfig(parsed: Record<string, unknown>): AutoContinueConfig {
  const config: AutoContinueConfig = { ...DEFAULT_CONFIG }

  if (typeof parsed.enabled === 'boolean') config.enabled = parsed.enabled
  if (typeof parsed.throttleMs === 'number') config.throttleMs = parsed.throttleMs
  if (typeof parsed.delayMs === 'number') config.delayMs = parsed.delayMs
  if (typeof parsed.maxConsecutive === 'number') config.maxConsecutive = parsed.maxConsecutive
  if (Array.isArray(parsed.providers)) {
    config.providers = parsed.providers.filter((p): p is string => typeof p === 'string')
  }
  if (Array.isArray(parsed.errorPatterns)) {
    config.errorPatterns = parsed.errorPatterns.filter((p): p is string => typeof p === 'string')
  }
  if (Array.isArray(parsed.excludePatterns)) {
    config.excludePatterns = parsed.excludePatterns.filter((p): p is string => typeof p === 'string')
  }

  return config
}

/** Read `<directory>/.opencode/auto-continue.jsonc`; missing file means defaults. */
export async function loadConfig(directory: string): Promise<AutoContinueConfig> {
  try {
    const raw = await readFile(join(directory, CONFIG_RELATIVE_PATH), 'utf-8')
    const parsed = parseJsonc(raw)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return mergeConfig(parsed as Record<string, unknown>)
    }
  } catch {
    // Missing or malformed config falls back to defaults.
  }
  return { ...DEFAULT_CONFIG }
}

/** True when the session's provider is one this plugin is meant to help. */
export function providerAllowed(providerID: string | undefined, config: AutoContinueConfig): boolean {
  if (!providerID) return false
  const id = providerID.toLowerCase()
  return config.providers.some((p) => p.toLowerCase() === id)
}

function errorParts(error: unknown): { name: string; message: string } {
  if (!error || typeof error !== 'object') return { name: '', message: '' }
  const err = error as Record<string, unknown>
  const data = err.data as Record<string, unknown> | undefined
  return {
    name: typeof err.name === 'string' ? err.name : '',
    message:
      (typeof data?.message === 'string' ? data.message : null) ??
      (typeof err.message === 'string' ? err.message : ''),
  }
}

export function isRetryableError(error: unknown, config: AutoContinueConfig): boolean {
  if (!error || typeof error !== 'object') return false
  const { name, message } = errorParts(error)
  const matchStr = `${name}: ${message}`.toLowerCase()

  for (const pattern of config.excludePatterns) {
    if (matchStr.includes(pattern.toLowerCase())) return false
  }
  for (const pattern of config.errorPatterns) {
    if (matchStr.includes(pattern.toLowerCase())) return true
  }
  return false
}

export function errorMessage(error: unknown): string {
  const { name, message } = errorParts(error)
  return message || name || 'unknown'
}
