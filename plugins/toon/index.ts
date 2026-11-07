/**
 * toon plugin — compacts large JSON tool output into TOON for the model's
 * context, and restores the JSON before a later `bash` command consumes it.
 *
 * Home-rolled counterpart of `opencode-toon-plugin`: same two hooks, same
 * size-gated behaviour, but the codec lives in `./toon.ts` (no dependency) and
 * every conversion is verified by a round trip before it is used. A payload the
 * codec cannot reproduce exactly is left as JSON — there is no lossy path.
 *
 * Hooks (v1 plugin API):
 *   tool.execute.after  — eligible tool output, JSON, ≥256 chars → TOON if shorter
 *   tool.execute.before — bash command, quoted payloads/heredocs → original JSON
 */

import { createHash } from "node:crypto"
import type { Plugin } from "@opencode-ai/plugin"

import { decode, toonify } from "./toon"

const DEFAULT_ELIGIBLE_TOOLS = ["bash"]
const MAX_CACHED_OUTPUTS = 100
const MIN_JSON_LENGTH = 256
const MAX_INPUT_LENGTH = 4 * 1024 * 1024

type Cached = { json: string; toon: string }

const converted = new Map<string, Cached>()

function debug(...args: unknown[]) {
  if (process.env.OPENCODE_TOON_DEBUG) console.error("[toon]", ...args)
}

function eligibleTools(): Set<string> {
  const raw = process.env.OPENCODE_TOON_TOOLS ?? process.env.OPENCODE_TOON_PLUGIN_TOOLS
  return new Set(
    (raw ? raw.split(",") : DEFAULT_ELIGIBLE_TOOLS)
      .map((tool) => tool.trim().toLowerCase())
      .filter(Boolean),
  )
}

function hash(text: string) {
  return createHash("sha256").update(text).digest("hex")
}

function remember(toon: string, json: string) {
  converted.set(hash(toon), { json, toon })
  while (converted.size > MAX_CACHED_OUTPUTS) {
    const oldest = converted.keys().next().value
    if (oldest === undefined) break
    converted.delete(oldest)
  }
}

function recall(toon: string): string | undefined {
  return converted.get(hash(toon))?.json
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

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

function shellSingleQuote(text: string) {
  return `'${text.replaceAll("'", "'\\''")}'`
}

/** JSON to put in place of a forwarded payload, or undefined to leave it alone. */
function forwardedJson(text: string): string | undefined {
  const trimmed = text.trim()
  const cached = recall(trimmed)
  if (cached !== undefined) return cached
  if (!looksLikeToon(trimmed)) return undefined
  try {
    const decoded = decode(trimmed)
    if (!isRecord(decoded) && !Array.isArray(decoded)) return undefined
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

function replaceQuotedPayloads(command: string): string {
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
  return replaceCached(replaceQuotedPayloads(replaceHeredocs(command)))
}

function commandOf(args: unknown): string | undefined {
  if (!isRecord(args)) return undefined
  return typeof args.command === "string" ? args.command : undefined
}

const ToonPlugin: Plugin = async () => {
  const eligible = eligibleTools()

  return {
    "tool.execute.before": async (input, output) => {
      if (input.tool.toLowerCase() !== "bash") return
      const command = commandOf(output.args)
      if (command === undefined) return
      const replaced = restore(command)
      if (replaced !== command) output.args.command = replaced
    },

    "tool.execute.after": async (input, output) => {
      if (!eligible.has(input.tool.toLowerCase())) return
      if (typeof output.output !== "string") return

      const original = output.output
      const trimmed = original.trim()
      if (trimmed.length < MIN_JSON_LENGTH) return
      if (trimmed.length > MAX_INPUT_LENGTH) return
      if (!looksLikeJson(trimmed)) return

      const toon = toonify(trimmed)
      if (toon === null) return

      remember(toon, trimmed)
      output.output = toon
      debug(`compact ${input.tool}: ${trimmed.length} → ${toon.length} chars`)
    },
  }
}

export default ToonPlugin
