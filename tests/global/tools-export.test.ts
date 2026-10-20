/**
 * tools-export.test.ts — every .ts file in tools/ must be a real OpenCode tool.
 *
 * OpenCode discovers tools by scanning tools/*.ts and calling the default export
 * (or the exported factory). A file that exports nothing, or exports a plain
 * object instead of a tool() result, is invisible to the runtime. It sits on
 * disk looking like a capability and does nothing.
 *
 * The failure mode this catches: a tool file that compiles, passes a "does the
 * file exist" test, and never fires because the export shape is wrong. The hub
 * spec then routes to a tool that was never registered, and the agent reports
 * "tool not found" at dispatch time.
 *
 * This test asserts three things per file:
 *   1. it has a default export (or a named export that is a tool factory)
 *   2. the export is produced by tool(...) from @opencode-ai/plugin
 *   3. the file is not a hub manifest (those are identity slices, not tools)
 */

import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

const TOOLS_DIR = path.resolve(__dirname, '..', '..', 'tools')

function getToolFiles(): Array<{ name: string; path: string; src: string }> {
  if (!fs.existsSync(TOOLS_DIR)) return []
  return fs.readdirSync(TOOLS_DIR)
    .filter((f) => f.endsWith('.ts') && !f.endsWith('.d.ts'))
    .map((f) => ({
      name: f.replace(/\.ts$/, ''),
      path: path.join(TOOLS_DIR, f),
      src: fs.readFileSync(path.join(TOOLS_DIR, f), 'utf-8'),
    }))
}

// Hub manifests are thin identity slices re-exported from tools/hubs/<hub>/index.ts.
// They are valid TypeScript but are NOT tools and must not be held to the tool contract.
function isHubManifest(name: string, src: string): boolean {
  if (!name.startsWith('hub-')) return false
  // A hub manifest re-exports from ./hubs/ and has no tool() call.
  return !/tool\s*\(/.test(src) && /from\s+['"]\.\/hubs\//.test(src)
}

// Files that are part of the tooling but are not themselves OpenCode tools.
const NON_TOOL_ALLOWLIST = new Set([
  'hub-data',           // shared types and helpers for hub manifests
  'build-spec-registry', // build-time script, not a runtime tool
  'validate-delegation', // CLI script used by tests, not a tool
  'state-utils',        // shared state-path helpers imported by tools
  'cache-utils',        // shared CacheManager + tool-cache wrapper imported by tools
  'audit-density',      // legacy description/handler export shape, pre-tool() convention
])

describe('tools export contract', () => {
  const files = getToolFiles().filter(({ name, src }) => !isHubManifest(name, src) && !NON_TOOL_ALLOWLIST.has(name))

  it('finds tool files to test', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  it.each(files)('%s imports tool from @opencode-ai/plugin', ({ name, src }) => {
    expect(src, `${name}: missing import of tool from @opencode-ai/plugin`).toMatch(
      /import\s+.*tool.*from\s+['"]@opencode-ai\/plugin['"]/,
    )
  })

  it.each(files)('%s calls tool(...) to produce its export', ({ name, src }) => {
    expect(src, `${name}: no tool() call found`).toMatch(/\btool\s*\(/)
  })

  it.each(files)('%s has a default export (the tool definition)', ({ name, src }) => {
    expect(src, `${name}: missing default export`).toMatch(/export\s+default/)
  })

  it.each(files)('%s has a description string', ({ name, src }) => {
    expect(src, `${name}: no description field`).toMatch(/description\s*:/)
  })

  it.each(files)('%s has an execute function', ({ name, src }) => {
    expect(src, `${name}: no execute function`).toMatch(/execute\s*[:(]/)
  })

  it.each(files)('%s does not hardcode a model or provider in its source', ({ name, src }) => {
    // Model choice is runtime/user; a tool that bakes in a provider name or
    // model id breaks the config's no-pin policy.
    expect(src, `${name}: references a specific provider`).not.toMatch(/"anthropic"|"openai"|"google"/)
  })
})

describe('hub manifests are identity slices, not tools', () => {
  const all = getToolFiles()
  const manifests = all.filter(({ name, src }) => isHubManifest(name, src))

  it('finds hub manifests', () => {
    expect(manifests.length).toBeGreaterThan(0)
  })

  it.each(manifests)('%s re-exports from ./hubs/', ({ name, src }) => {
    expect(src, `${name}: does not re-export from ./hubs/`).toMatch(/from\s+['"]\.\/hubs\//)
  })

  it.each(manifests)('%s does NOT call tool() (it is a manifest, not a tool)', ({ name, src }) => {
    expect(src, `${name}: unexpectedly calls tool()`).not.toMatch(/\btool\s*\(/)
  })
})
