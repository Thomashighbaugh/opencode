/**
 * mcp-config.test.ts — the mcp block in opencode.jsonc.
 *
 * Three servers are wired: context7 (remote docs), searxng (local search),
 * gh_grep (remote code search). Each one fails silently if misconfigured — a
 * wrong URL, a missing env var, a typo'd command — and the failure mode is the
 * agent reaching for a hosted web search or grep.app query and getting nothing
 * back, then reasoning about why the web is "down" instead of fixing the config.
 *
 * These tests assert the structural contract: enabled servers have reachable
 * shapes, env references resolve to declared vars, URLs are well-formed, and
 * no secret is hardcoded.
 */

import { describe, it, expect } from 'vitest'
import * as path from 'path'
import { loadConfig } from '../helpers/load-config'

const CONFIG_DIR = path.resolve(__dirname, '..', '..')

const root = loadConfig(CONFIG_DIR)
if (!root) throw new Error(`No opencode.json(c) in ${CONFIG_DIR}`)
const { config } = root

type McpServer = {
  enabled?: boolean
  type?: 'local' | 'remote'
  url?: string
  command?: string[]
  environment?: Record<string, string>
  headers?: Record<string, string>
}

function getMcp(): Record<string, McpServer> {
  const mcp = config.mcp as Record<string, McpServer> | undefined
  expect(mcp, 'config has no mcp block').toBeDefined()
  return mcp!
}

describe('mcp block', () => {
  const mcp = getMcp()
  const entries = Object.entries(mcp)

  it('has at least one server configured', () => {
    expect(entries.length).toBeGreaterThan(0)
  })

  it.each(entries)('%s has a valid type', (key, srv) => {
    expect(['local', 'remote'], `${key}: type "${srv.type}" is not local|remote`).toContain(srv.type)
  })

  it.each(entries)('%s: a local server has a command, a remote server has a URL', (key, srv) => {
    if (srv.type === 'local') {
      expect(Array.isArray(srv.command), `${key}: local server missing command array`).toBe(true)
      expect(srv.command!.length, `${key}: command array is empty`).toBeGreaterThan(0)
      expect(typeof srv.command![0], `${key}: command[0] is not a string`).toBe('string')
    }
    if (srv.type === 'remote') {
      expect(typeof srv.url, `${key}: remote server missing url`).toBe('string')
      expect(srv.url!.length, `${key}: url is empty`).toBeGreaterThan(0)
    }
  })

  it.each(entries)('%s: remote URL is https or localhost', (key, srv) => {
    if (srv.type !== 'remote' || !srv.url) return
    const ok = srv.url.startsWith('https://') || srv.url.startsWith('http://localhost') || srv.url.startsWith('http://127.0.0.1')
    expect(ok, `${key}: url "${srv.url}" is not https and not localhost`).toBe(true)
  })

  it.each(entries)('%s: headers reference env vars, not literal secrets', (key, srv) => {
    if (!srv.headers) return
    for (const [header, value] of Object.entries(srv.headers)) {
      // The {env:VAR} pattern is the only allowed secret shape. A literal value
      // that looks like a key is a leak. Check the env ref FIRST — the header
      // NAME (CONTEXT7_API_KEY) matches /api_key/i, so a naive secret regex
      // would flag the correct env reference as a leak.
      const looksLikeEnvRef = /^\{env:[A-Z0-9_]+\}$/.test(value)
      if (looksLikeEnvRef) return
      const looksLikeSecret = /sk-[A-Za-z0-9_-]{10,}|ghp_[A-Za-z0-9]{10,}|Bearer\s+[A-Za-z0-9._-]{10,}/.test(value)
      expect(looksLikeSecret, `${key}: header "${header}" contains a hardcoded secret`).toBe(false)
      if (header.toLowerCase().includes('key') || header.toLowerCase().includes('token') || header.toLowerCase().includes('auth')) {
        expect(looksLikeEnvRef, `${key}: auth header "${header}" is not an {env:...} reference`).toBe(true)
      }
    }
  })

  it.each(entries)('%s: environment values that look like secrets are not literal', (key, srv) => {
    if (!srv.environment) return
    for (const [varName, value] of Object.entries(srv.environment)) {
      const looksSecret = /sk-[A-Za-z0-9_-]{10,}|ghp_[A-Za-z0-9]{10,}|-----BEGIN/.test(value)
      expect(looksSecret, `${key}: env "${varName}" contains a hardcoded secret`).toBe(false)
    }
  })

  it('context7 is enabled and points at the documented MCP endpoint', () => {
    const c7 = mcp.context7
    expect(c7, 'context7 is not configured').toBeDefined()
    expect(c7.enabled, 'context7 is disabled').toBe(true)
    expect(c7.type).toBe('remote')
    expect(c7.url).toBe('https://mcp.context7.com/mcp')
  })

  it('context7 passes its API key via env reference, not inline', () => {
    const c7 = mcp.context7
    const key = c7?.headers?.CONTEXT7_API_KEY
    expect(key, 'context7 has no CONTEXT7_API_KEY header').toBeDefined()
    expect(key).toBe('{env:CONTEXT7_API_KEY}')
  })

  it('searxng is enabled and uses a local command transport', () => {
    const sx = mcp.searxng
    expect(sx, 'searxng is not configured').toBeDefined()
    expect(sx.enabled, 'searxng is disabled').toBe(true)
    expect(sx.type).toBe('local')
    expect(sx.command).toContain('mcp-searxng')
  })

  it('searxng declares the SEARXNG_URL it will query', () => {
    const sx = mcp.searxng
    expect(sx?.environment?.SEARXNG_URL, 'searxng has no SEARXNG_URL').toBeDefined()
    expect(sx.environment!.SEARXNG_URL).toMatch(/^https?:\/\//)
  })

  it('gh_grep is enabled and points at the grep.app MCP endpoint', () => {
    const gg = mcp.gh_grep
    expect(gg, 'gh_grep is not configured').toBeDefined()
    expect(gg.enabled, 'gh_grep is disabled').toBe(true)
    expect(gg.type).toBe('remote')
    expect(gg.url).toBe('https://mcp.grep.app')
  })

  it('no enabled server is missing its required transport', () => {
    for (const [key, srv] of entries) {
      if (srv.enabled === false) continue
      if (srv.type === 'local') {
        expect(srv.command?.length, `enabled local server "${key}" has no command`).toBeGreaterThan(0)
      }
      if (srv.type === 'remote') {
        expect(srv.url, `enabled remote server "${key}" has no url`).toBeTruthy()
      }
    }
  })
})
