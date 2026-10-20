/**
 * provider-config.test.ts — the provider.models catalog in opencode.jsonc.
 *
 * This config ships 39 model entries under provider.profundo.models. Every one
 * of them is read by OpenCode at session start to decide: does this model take
 * attachments? what is its context window? can I stream reasoning? A malformed
 * entry does not crash the config — it silently gives the model the wrong
 * limits, so the agent truncates a prompt it thought fit, or tries to attach a
 * PDF to a text-only model. These are the failures that only show up as a weird
 * error mid-session, three days after the config edit.
 *
 * Nothing here asserts on which models exist — that is the user's catalog to
 * curate. Everything asserts that whatever IS there is internally consistent:
 * required fields present, limits sane, modalities well-formed, no leaked
 * secrets, and the comment claims (128K floor, flat-rate, etc.) hold.
 */

import { describe, it, expect } from 'vitest'
import * as path from 'path'
import { loadConfig } from '../helpers/load-config'

const CONFIG_DIR = path.resolve(__dirname, '..', '..')

const root = loadConfig(CONFIG_DIR)
if (!root) throw new Error(`No opencode.json(c) in ${CONFIG_DIR}`)
const { config } = root

type ModelEntry = {
  name?: string
  family?: string
  release_date?: string
  attachment?: boolean
  reasoning?: boolean
  temperature?: boolean
  tool_call?: boolean
  limit?: { context?: number; output?: number }
  modalities?: { input?: string[]; output?: string[] }
}

function getProvider(): Record<string, any> {
  const provider = config.provider as Record<string, any> | undefined
  expect(provider, 'config has no provider block').toBeDefined()
  return provider!
}

function getModels(): Record<string, ModelEntry> {
  const provider = getProvider()
  const keys = Object.keys(provider)
  expect(keys.length, 'no provider is configured').toBeGreaterThan(0)
  const models = provider[keys[0]]?.models as Record<string, ModelEntry> | undefined
  expect(models, `provider "${keys[0]}" has no models block`).toBeDefined()
  return models!
}

const VALID_INPUT_MODALITIES = new Set(['text', 'image', 'pdf', 'audio', 'video'])
const VALID_OUTPUT_MODALITIES = new Set(['text', 'image', 'audio'])

describe('provider block', () => {
  it('has exactly the fields OpenCode reads at the provider level', () => {
    const provider = getProvider()
    const keys = Object.keys(provider)
    for (const provKey of keys) {
      const prov = provider[provKey]
      // OpenCode reads: name, npm, options, models. Anything else is dead config.
      const allowed = new Set(['name', 'npm', 'options', 'models', 'api', 'env', 'id'])
      const extra = Object.keys(prov).filter((k) => !allowed.has(k))
      expect(extra, `provider "${provKey}" carries unread keys: ${extra.join(', ')}`).toEqual([])
    }
  })

  it('uses an OpenAI-compatible SDK adapter for a custom baseURL', () => {
    const provider = getProvider()
    for (const [key, prov] of Object.entries(provider)) {
      if (prov.options?.baseURL && !prov.npm) {
        throw new Error(`provider "${key}" has a custom baseURL but no npm adapter — OpenCode cannot reach it`)
      }
    }
    const prov = Object.values(provider)[0]
    expect(prov.npm).toBe('@ai-sdk/openai-compatible')
  })

  it('baseURL is https, not http — no plaintext traffic to the API host', () => {
    const provider = getProvider()
    for (const [key, prov] of Object.entries(provider)) {
      const url = prov.options?.baseURL as string | undefined
      if (!url) continue
      expect(url.startsWith('https://'), `provider "${key}" baseURL is not https: ${url}`).toBe(true)
    }
  })

  it('contains no API key or secret material — keys live in env, not in the config file', () => {
    const raw = JSON.stringify(config.provider)
    // Common secret shapes: sk-*, bearer tokens, api_key fields, Authorization headers.
    expect(raw).not.toMatch(/sk-[A-Za-z0-9_-]{16,}/)
    expect(raw).not.toMatch(/bearer\s+[A-Za-z0-9._-]{20,}/i)
    expect(raw).not.toMatch(/"api[_-]?key"\s*:/i)
    expect(raw).not.toMatch(/"authorization"\s*:/i)
  })
})

describe('provider models: structural integrity', () => {
  const models = getModels()
  const entries = Object.entries(models)

  it('has at least one model', () => {
    expect(entries.length).toBeGreaterThan(0)
  })

  it.each(entries)('%s has a human-readable name', (key, m) => {
    expect(m.name, `${key}: missing name`).toBeTruthy()
    expect(typeof m.name).toBe('string')
    expect(m.name!.length, `${key}: name is suspiciously short`).toBeGreaterThan(2)
  })

  it.each(entries)('%s declares a context limit', (key, m) => {
    expect(m.limit, `${key}: missing limit block`).toBeDefined()
    expect(typeof m.limit!.context, `${key}: limit.context is not a number`).toBe('number')
    expect(m.limit!.context!, `${key}: limit.context is not positive`).toBeGreaterThan(0)
  })

  it.each(entries)('%s output limit does not exceed context limit', (key, m) => {
    if (m.limit?.output == null || m.limit?.context == null) return
    expect(
      m.limit.output,
      `${key}: output (${m.limit.output}) > context (${m.limit.context}) — a model cannot emit more than it can hold`,
    ).toBeLessThanOrEqual(m.limit.context)
  })

  it.each(entries)('%s context limit is a plausible token window', (key, m) => {
    // Real context windows are multiples of 1024 (32K=32768, 128K=131072,
    // 256K=262144, 1M=1048576) or clean decimal thousands (128000, 200000).
    // A value like 128001 or 200001 is a typo that will mislead truncation logic.
    const ctx = m.limit!.context!
    const isKiB = ctx % 1024 === 0
    const isDecimalK = ctx % 1000 === 0
    const knownIrregular = new Set([983616]) // qwen-3.5-omni-plus: published window, not a typo
    if (knownIrregular.has(ctx)) return
    expect(isKiB || isDecimalK, `${key}: context ${ctx} is neither a KiB multiple nor a decimal thousand — likely a typo`).toBe(true)
  })

  it.each(entries)('%s tool_call is a boolean when declared', (key, m) => {
    if (m.tool_call == null) return
    expect(typeof m.tool_call, `${key}: tool_call must be boolean`).toBe('boolean')
  })

  it.each(entries)('%s reasoning is a boolean when declared', (key, m) => {
    if (m.reasoning == null) return
    expect(typeof m.reasoning, `${key}: reasoning must be boolean`).toBe('boolean')
  })

  it.each(entries)('%s attachment is a boolean when declared', (key, m) => {
    if (m.attachment == null) return
    expect(typeof m.attachment, `${key}: attachment must be boolean`).toBe('boolean')
  })

  it.each(entries)('%s modalities are well-formed', (key, m) => {
    if (!m.modalities) return
    const { input, output } = m.modalities
    if (input) {
      for (const mod of input) {
        expect(VALID_INPUT_MODALITIES.has(mod), `${key}: unknown input modality "${mod}"`).toBe(true)
      }
    }
    if (output) {
      for (const mod of output) {
        expect(VALID_OUTPUT_MODALITIES.has(mod), `${key}: unknown output modality "${mod}"`).toBe(true)
      }
    }
  })

  it.each(entries)('%s attachment flag is consistent with input modalities', (key, m) => {
    // A text-only model that claims attachment support will accept a file it
    // cannot process; a multimodal model with attachment=false hides a real
    // capability. Both are config lies — flag the first as a hard error and
    // note the second.
    const input = m.modalities?.input ?? []
    const textOnly = input.length === 1 && input[0] === 'text'
    const multimodal = input.length > 1
    if (textOnly) {
      expect(m.attachment, `${key}: attachment=true but input modalities are ["text"] only`).not.toBe(true)
    }
    if (multimodal && m.attachment === false) {
      console.warn(`[provider] ${key}: multimodal but attachment=false — capability is hidden`)
    }
  })

  it.each(entries)('%s release_date, when present, is ISO-shaped', (key, m) => {
    if (m.release_date == null) return
    expect(m.release_date, `${key}: release_date "${m.release_date}" is not YYYY-MM-DD or YYYY-MM`).toMatch(
      /^\d{4}-\d{2}(-\d{2})?$/,
    )
  })
})

describe('provider models: the comment claims hold', () => {
  const models = getModels()
  const entries = Object.entries(models)

  it('no model claims a context below 128K (the stated safe floor)', () => {
    // The config comment says: "128K is the smallest target context in the
    // catalog, so it is the safe floor." A model below that floor makes the
    // claim false and breaks any truncation logic that assumes it.
    const below = entries.filter(([, m]) => (m.limit?.context ?? Infinity) < 128000)
    expect(below.map(([k]) => k), `models below the 128K floor: ${below.map(([k]) => k).join(', ')}`).toEqual([])
  })

  it('the catalog spans more than one vendor family', () => {
    // A single-vendor catalog is a silent monoculture risk for a routing
    // config. This is a diversity smoke check, not a quota.
    const families = new Set(entries.map(([, m]) => m.family).filter(Boolean))
    expect(families.size, 'catalog has fewer than 2 model families').toBeGreaterThan(1)
  })

  it('at least one model supports attachments (the config promises multimodal)', () => {
    const withAttach = entries.filter(([, m]) => m.attachment === true)
    expect(withAttach.length, 'no model in the catalog supports attachments').toBeGreaterThan(0)
  })
})
