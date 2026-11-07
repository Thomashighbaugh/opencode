/**
 * toon — server entrypoint (OpenCode 2).
 *
 * `execute.before` restores JSON from a remembered TOON payload before bash sees
 * it; `execute.after` compacts large JSON results to TOON. V2 hooks expose
 * `event.input` (mutable) and `event.result` (mutable) instead of the V1
 * `(input, output)` pair — the codec and the guards are unchanged.
 */

import { createHash } from "node:crypto"

import { decode, toonify } from "./toon.ts"

const DEFAULT_ELIGIBLE_TOOLS = [
  "bash",
  "hubmenu",
  "codesearch",
  "cache",
  "regex-edit",
  "json-edit",
  "yaml-edit",
  "conf-edit",
  "multi-edit",
]

const MAX_CACHED_OUTPUTS = 100
const MIN_JSON_LENGTH = 256
const MAX_INPUT_LENGTH = 4 * 1024 * 1024

const converted = new Map<string, { json: string; toon: string }>()

function hash(text: string) {
  return createHash("sha256").update(text).digest("hex")
}

function eligibleTools(): Set<string> {
  const raw = process.env.OPENCODE_TOON_TOOLS ?? process.env.OPENCODE_TOON_PLUGIN_TOOLS
  return new Set(
    (raw ? raw.split(",") : DEFAULT_ELIGIBLE_TOOLS).map((tool) => tool.trim().toLowerCase()).filter(Boolean),
  )
}

function remember(toon: string, json: string) {
  converted.set(hash(toon), { json, toon })
  while (converted.size > MAX_CACHED_OUTPUTS) {
    const oldest = converted.keys().next().value
    if (oldest === undefined) break
    converted.delete(oldest)
  }
}

const recall = (toon: string) => converted.get(hash(toon))?.json

function looksLikeJson(text: string) {
  if (text.length < 2) return false
  const first = text[0]
  const last = text[text.length - 1]
  return (first === "{" && last === "}") || (first === "[" && last === "]")
}

function looksLikeToon(text: string) {
  const trimmed = text.trim()
  if (trimmed.length < 32) return false
  if (looksLikeJson(trimmed)) return false
  if (!trimmed.includes("\n")) return false
  return /(^|\n)\s*(?:[^\s:[\]{}]+)?\[\d+\](?:\{[^}\n]*\})?:/.test(trimmed)
}

const shellSingleQuote = (text: string) => `'${text.replaceAll("'", "'\\''")}'`

function forwardedJson(text: string): string | undefined {
  const trimmed = text.trim()
  const cached = recall(trimmed)
  if (cached !== undefined) return cached
  if (!looksLikeToon(trimmed)) return undefined
  try {
    const decoded = decode(trimmed)
    if (typeof decoded !== "object" || decoded === null) return undefined
    return JSON.stringify(decoded)
  } catch {
    return undefined
  }
}

function replaceHeredocs(command: string): string {
  return command.replace(
    /(<<-?\s*(['"]?)([A-Za-z_][A-Za-z0-9_]*)\2[^\n]*\n)([\s\S]*?)(\n\3(?:\n|$))/g,
    (match, prefix: string, _quote: string, _marker: string, body: string, suffix: string) => {
      const json = forwardedJson(body)
      return json === undefined ? match : `${prefix}${json}${suffix}`
    },
  )
}

function replaceQuoted(command: string): string {
  const single = command.replace(/'([^']*)'/g, (match, body: string) => {
    const json = forwardedJson(body)
    return json === undefined ? match : shellSingleQuote(json)
  })
  return single.replace(/"((?:\\.|[^"\\])*)"/g, (match, body: string) => {
    const json = forwardedJson(body)
    return json === undefined ? match : shellSingleQuote(json)
  })
}

function replaceCached(command: string): string {
  let result = command
  for (const { json, toon } of converted.values()) {
    if (!result.includes(toon)) continue
    result = result.replaceAll(toon, shellSingleQuote(json))
  }
  return result
}

function restore(command: string): string {
  return replaceCached(replaceQuoted(replaceHeredocs(command)))
}

function compact(text: string): string | null {
  if (typeof text !== "string") return null
  const trimmed = text.trim()
  if (trimmed.length < MIN_JSON_LENGTH || trimmed.length > MAX_INPUT_LENGTH) return null
  if (!looksLikeJson(trimmed)) return null
  const toon = toonify(trimmed)
  if (toon === null) return null
  remember(toon, trimmed)
  return toon
}

export default {
  id: "toon",
  async setup(ctx: any) {
    const eligible = eligibleTools()

    await ctx.tool.hook("execute.before", (event: any) => {
      if (String(event.tool).toLowerCase() !== "bash") return
      const input = event.input as { command?: unknown } | undefined
      if (!input || typeof input.command !== "string") return
      const restored = restore(input.command)
      if (restored !== input.command) input.command = restored
    })

    await ctx.tool.hook("execute.after", (event: any) => {
      if (event.status !== "completed") return
      if (!eligible.has(String(event.tool).toLowerCase())) return
      const result = event.result as { content?: unknown } | undefined
      if (!result) return

      if (typeof result.content === "string") {
        const toon = compact(result.content)
        if (toon !== null) result.content = toon
        return
      }

      if (Array.isArray(result.content)) {
        for (const part of result.content) {
          if (part && typeof part === "object" && part.type === "text" && typeof part.text === "string") {
            const toon = compact(part.text)
            if (toon !== null) part.text = toon
          }
        }
      }
    })
  },
}
