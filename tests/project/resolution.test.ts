import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import { loadConfig, parseJsonc } from '../helpers/load-config'
import { resolveRef, resolveInstruction, resolvePlugin, scanEntities } from '../helpers/resolve-refs'
import { fixturePath, loadFixtureConfig } from '../helpers/project-fixtures'

const FIXTURE = 'sample-project'
const FIXTURE_DIR = fixturePath(FIXTURE)

describe('project config resolution', () => {
  describe('fixture integrity', () => {
    it('fixture directory exists', () => {
      expect(fs.existsSync(FIXTURE_DIR)).toBe(true)
    })

    it('fixture has .opencode directory', () => {
      expect(fs.existsSync(path.join(FIXTURE_DIR, '.opencode'))).toBe(true)
    })

    it('fixture config loads successfully', () => {
      const cfg = loadFixtureConfig(FIXTURE)
      expect(cfg).not.toBeNull()
      expect(cfg!.config).toBeDefined()
    })
  })

  describe('config override resolution', () => {
    const cfg = loadFixtureConfig(FIXTURE)
    if (!cfg) throw new Error('Fixture config not found')
    const { config, configDir } = cfg

    it('model override is applied', () => {
      expect(config.model).toBe('ollama/glm-5.2:cloud')
    })

    it('default_agent override is applied', () => {
      expect(config.default_agent).toBe('my-agent')
    })

    it('has project-specific agent definition', () => {
      expect(config.agent).toBeDefined()
      const agents = config.agent as Record<string, unknown>
      expect(agents['my-agent']).toBeDefined()
    })

    it('instructions reference fixture-local paths', () => {
      const instructions = config.instructions as string[]
      expect(instructions).toContain('./rules/my-rule.md')
    })
  })

  describe('file resolution with global fallback', () => {
    it('resolves fixture-local instruction file', () => {
      const resolved = resolveInstruction('./rules/my-rule.md', path.join(FIXTURE_DIR, '.opencode'))
      expect(resolved).toBeTruthy()
      expect(fs.existsSync(resolved!)).toBe(true)
    })

    it('falls back to global for AGENTS.md', () => {
      const resolved = resolveInstruction('AGENTS.md', path.join(FIXTURE_DIR, '.opencode'))
      expect(resolved).toBeTruthy()
      expect(fs.existsSync(resolved!)).toBe(true)
    })

    it('resolves global agent (hubs) from fixture', () => {
      const resolved = resolveRef('agent', 'hubs', FIXTURE_DIR)
      expect(resolved).toBeTruthy()
      expect(resolved).toContain('hubs.md')
    })

    it('resolves global skill (verify) from fixture', () => {
      const resolved = resolveRef('skill', 'verify', FIXTURE_DIR)
      expect(resolved).toBeTruthy()
      expect(resolved).toContain('verify')
      expect(resolved).toContain('SKILL.md')
    })

    it('resolves global tool (validate-delegation) from fixture', () => {
      const resolved = resolveRef('tool', 'validate-delegation', FIXTURE_DIR)
      expect(resolved).toBeTruthy()
      expect(resolved).toContain('validate-delegation.ts')
    })
  })
})
