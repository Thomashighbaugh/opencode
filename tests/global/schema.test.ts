import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import { loadConfig, getGlobalConfigDir, parseJsonc } from '../helpers/load-config'

// This repo IS the global config directory — resolve from tests/ to project root
const CONFIG_DIR = path.resolve(__dirname, '..', '..')
const GLOBAL_DIR = getGlobalConfigDir()

// Known valid top-level keys from OpenCode schema (https://opencode.ai/config.json)
const VALID_KEYS = new Set([
  '$schema', 'shell', 'logLevel', 'server', 'command', 'skills',
  'references', 'watcher', 'snapshot', 'plugin',
  'share', 'autoupdate', 'disabled_providers', 'enabled_providers',
  'model', 'small_model', 'default_agent', 'username', 'agent',
  'provider', 'mcp', 'formatter', 'lsp', 'instructions',
  'permission', 'attachment', 'enterprise', 'tool_output',
  'compaction', 'experimental',
])

// Keys that are deprecated
const DEPRECATED_KEYS = new Set([
  'reference',  // → references
  'autoshare',  // → share
  'mode',       // → agent
  'layout',     // deprecated, always stretch
  'maxSteps',   // → steps (inside AgentConfig)
])

// Keys that are NOT valid at top level
const INVALID_KEYS = new Set([
  'agents', 'commands', 'rules', 'agentPaths', 'project',
])

describe('opencode.jsonc schema compliance', () => {
  const configRoot = loadConfig(CONFIG_DIR)
  if (!configRoot) throw new Error(`No opencode.json(c) found in ${CONFIG_DIR}`)

  const { config, configPath } = configRoot
  const topKeys = Object.keys(config)

  describe('top-level keys', () => {
    it('loads config file successfully', () => {
      expect(config).toBeDefined()
      expect(typeof config).toBe('object')
    })

    it('has no completely unknown keys (warn-only)', () => {
      const unknown = topKeys.filter((k) => !VALID_KEYS.has(k) && !DEPRECATED_KEYS.has(k) && !INVALID_KEYS.has(k))
      // Unknown keys are informational warnings, not failures
      if (unknown.length > 0) {
        console.warn(`[schema] Unknown top-level keys (may not be recognized): ${unknown.join(', ')}`)
      }
      expect(unknown).toEqual([])
    })

    it('has no deprecated keys', () => {
      const deprecated = topKeys.filter((k) => DEPRECATED_KEYS.has(k))
      expect(deprecated).toEqual([])
    })

    it('has no invalid keys', () => {
      const invalid = topKeys.filter((k) => INVALID_KEYS.has(k))
      expect(invalid).toEqual([])
    })

    it('all keys are either valid or known-deprecated', () => {
      const allKnown = new Set([...VALID_KEYS, ...DEPRECATED_KEYS, ...INVALID_KEYS])
      const unknown = topKeys.filter((k) => !allKnown.has(k))
      expect(unknown).toEqual([])
    })
  })

  describe('recommended keys', () => {
    it('should have $schema pointing to OpenCode config schema', () => {
      expect(config['$schema']).toBe('https://opencode.ai/config.json')
    })

    it('should NOT pin a model — model is chosen at runtime', () => {
      // This config deliberately pins no model. OpenCode (or the user) selects
      // the model at runtime, so a hardcoded `model` here would override that.
      expect(config.model).toBeUndefined()
      expect(config.small_model).toBeUndefined()
    })

    it('should have a default_agent configured', () => {
      expect(config.default_agent).toBeDefined()
      expect(typeof config.default_agent).toBe('string')
    })
  })

  describe('project templates pin no model', () => {
    // Six of the seven archetypes shipped `"default_model":
    // "opencode/deepseek-v4-flash-free"` and nothing in the repo ever read the
    // field — dead metadata that still looked like a pin, and would have been
    // copied into a provisioned project by whoever added the first consumer. The
    // policy tests above only covered opencode.jsonc and agents/, which is
    // exactly how these survived.
    it('every archetype manifest leaves default_model unset', () => {
      const dir = path.join(CONFIG_DIR, 'templates', 'projects')
      const manifests = fs.readdirSync(dir)
        .map((name) => path.join(dir, name, 'manifest.json'))
        .filter((f) => fs.existsSync(f))

      expect(manifests.length).toBeGreaterThan(0)
      const pinned = manifests
        .filter((f) => parseJsonc(fs.readFileSync(f, 'utf-8'))?.default_model != null)
        .map((f) => path.relative(CONFIG_DIR, f))
      expect(pinned, `template(s) pin a model: ${pinned.join(', ')}`).toEqual([])
    })
  })

  describe('permission structure', () => {
    it('has a permission section', () => {
      expect(config.permission).toBeDefined()
      expect(typeof config.permission).toBe('object')
    })

    it('has bash permission set', () => {
      const perm = config.permission as Record<string, unknown>
      expect(perm.bash).toBeDefined()
    })
  })
})
