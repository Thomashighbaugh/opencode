/**
 * auto-continue.test.ts — the Profundo-only retry loop, driven for real.
 *
 * The plugin is invoked with a fake client, events are fired through the same
 * handlers OpenCode calls, and the assertions are on what got sent. Nothing here
 * reads source text.
 */

import { describe, it, expect, afterAll } from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

const core = await import('../../plugins/auto-continue/core.ts')
const plugin = (await import('../../plugins/auto-continue/plugin.ts')).default

const fixtures: string[] = []

function fixture(config?: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'auto-continue-'))
  fixtures.push(dir)
  if (config !== undefined) {
    fs.mkdirSync(path.join(dir, '.opencode'), { recursive: true })
    fs.writeFileSync(path.join(dir, '.opencode', 'auto-continue.jsonc'), config)
  }
  return dir
}

afterAll(() => {
  for (const dir of fixtures) fs.rmSync(dir, { recursive: true, force: true })
})

const tick = (ms = 10) => new Promise((resolve) => setTimeout(resolve, ms))

async function harness(config?: string, messages: any[] = []) {
  const sent: Array<{ sessionID: string; text: string }> = []
  const client = {
    session: {
      promptAsync: async (opts: any) => {
        const text = opts.body.parts.map((p: any) => p.text).join('')
        sent.push({ sessionID: opts.path.id, text })
      },
      messages: async () => ({ data: messages }),
    },
  }
  const directory = fixture(config)
  const hooks = await plugin({ client, directory } as any)
  return { hooks, sent }
}

const PROFUNDO = { providerID: 'profundo', modelID: 'claude-opus-5' }
const OTHER = { providerID: 'anthropic', modelID: 'claude-sonnet-4' }

async function setModel(hooks: any, sessionID: string, model: typeof PROFUNDO) {
  await hooks['chat.message']({ sessionID, model }, { message: {}, parts: [] })
}

async function errorAndIdle(hooks: any, sessionID: string, error: unknown) {
  await hooks.event({ event: { type: 'session.error', properties: { sessionID, error } } })
  await hooks.event({ event: { type: 'session.idle', properties: { sessionID } } })
  await tick()
}

const BAD_REQUEST = { name: 'APIError', data: { message: 'Bad Request' } }
const ABORTED = { name: 'MessageAbortedError', data: { message: 'The operation was aborted.' } }

describe('config', () => {
  it('falls back to defaults when the file is missing', async () => {
    const config = await core.loadConfig(fixture())
    expect(config.enabled).toBe(true)
    expect(config.providers).toEqual(['profundo'])
    expect(config.maxConsecutive).toBe(5)
  })

  it('merges overrides and keeps defaults for omitted keys', async () => {
    const config = await core.loadConfig(
      fixture(`{
        // comment
        "providers": ["profundo", "OpenRouter"],
        "delayMs": 0,
        "maxConsecutive": 2,
      }`),
    )
    expect(config.providers).toEqual(['profundo', 'OpenRouter'])
    expect(config.delayMs).toBe(0)
    expect(config.maxConsecutive).toBe(2)
    expect(config.throttleMs).toBe(core.DEFAULT_CONFIG.throttleMs)
  })
})

describe('matching', () => {
  it('matches transient errors case-insensitively', () => {
    expect(core.isRetryableError(BAD_REQUEST, core.DEFAULT_CONFIG)).toBe(true)
    expect(core.isRetryableError({ name: 'Error', message: 'ECONNRESET' }, core.DEFAULT_CONFIG)).toBe(true)
    expect(core.isRetryableError({ name: 'Error', message: 'no such file' }, core.DEFAULT_CONFIG)).toBe(false)
  })

  it('lets exclude patterns win', () => {
    expect(core.isRetryableError(ABORTED, core.DEFAULT_CONFIG)).toBe(false)
  })

  it('only allows configured providers', () => {
    expect(core.providerAllowed('profundo', core.DEFAULT_CONFIG)).toBe(true)
    expect(core.providerAllowed('PROFUNDO', core.DEFAULT_CONFIG)).toBe(true)
    expect(core.providerAllowed('anthropic', core.DEFAULT_CONFIG)).toBe(false)
    expect(core.providerAllowed(undefined, core.DEFAULT_CONFIG)).toBe(false)
  })
})

describe('plugin', () => {
  it('sends continue after a retryable Profundo error goes idle', async () => {
    const { hooks, sent } = await harness(`{ "delayMs": 0, "throttleMs": 0 }`)
    await setModel(hooks, 's1', PROFUNDO)
    await errorAndIdle(hooks, 's1', BAD_REQUEST)

    expect(sent).toEqual([{ sessionID: 's1', text: 'continue' }])
  })

  it('ignores other providers', async () => {
    const { hooks, sent } = await harness()
    await setModel(hooks, 's1', OTHER)
    await errorAndIdle(hooks, 's1', BAD_REQUEST)

    expect(sent).toEqual([])
  })

  it('never retries a user abort', async () => {
    const { hooks, sent } = await harness()
    await setModel(hooks, 's1', PROFUNDO)
    await errorAndIdle(hooks, 's1', ABORTED)

    expect(sent).toEqual([])
  })

  it('stops at maxConsecutive and resumes after a clean completion', async () => {
    const { hooks, sent } = await harness(`{ "delayMs": 0, "throttleMs": 0, "maxConsecutive": 2 }`)
    await setModel(hooks, 's1', PROFUNDO)

    await errorAndIdle(hooks, 's1', BAD_REQUEST)
    await errorAndIdle(hooks, 's1', BAD_REQUEST)
    await errorAndIdle(hooks, 's1', BAD_REQUEST)
    expect(sent).toHaveLength(2)

    await hooks.event!({
      event: {
        type: 'message.updated',
        properties: {
          info: {
            role: 'assistant',
            sessionID: 's1',
            providerID: 'profundo',
            modelID: 'claude-opus-5',
            time: { created: 1, completed: 2 },
          },
        },
      },
    } as any)

    await errorAndIdle(hooks, 's1', BAD_REQUEST)
    expect(sent).toHaveLength(3)
  })

  it('recovers the provider from stored messages when the error arrives first', async () => {
    const stored = [{ info: { role: 'assistant', providerID: 'profundo', modelID: 'claude-opus-5' }, parts: [] }]
    const { hooks, sent } = await harness(`{ "delayMs": 0 }`, stored)
    await errorAndIdle(hooks, 's1', BAD_REQUEST)

    expect(sent).toEqual([{ sessionID: 's1', text: 'continue' }])
  })
})
