import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import { loadConfig } from '../helpers/load-config'
import { resolveInstruction, resolvePlugin, scanEntities } from '../helpers/resolve-refs'

const CONFIG_DIR = path.resolve(__dirname, '..', '..')

describe('file integrity', () => {
  const configRoot = loadConfig(CONFIG_DIR)
  if (!configRoot) throw new Error(`No opencode.json(c) in ${CONFIG_DIR}`)
  const { config, configDir } = configRoot

  describe('instructions files', () => {
    const instructions = (config.instructions as string[]) ?? []

    it('has at least one instructions file', () => {
      expect(instructions.length).toBeGreaterThan(0)
    })

    it.each(instructions)('instruction file resolves: %s', (instPath: string) => {
      const resolved = resolveInstruction(instPath, configDir)
      expect(resolved, `Instruction not found: ${instPath}`).toBeTruthy()
      expect(fs.existsSync(resolved!), `File missing: ${resolved}`).toBe(true)
    })
  })

  describe('plugin paths', () => {
    const plugins = (config.plugin as string[]) ?? []

    it('has at least one plugin', () => {
      expect(plugins.length).toBeGreaterThan(0)
    })

    it.each(plugins)('plugin resolves: %s', (pluginPath: string) => {
      const resolved = resolvePlugin(pluginPath, configDir)
      expect(resolved, `Plugin not found: ${pluginPath}`).toBeTruthy()
    })
  })

  describe('agent files', () => {
    const agents = scanEntities('agent', CONFIG_DIR)

    it('finds at least one agent file', () => {
      expect(agents.length).toBeGreaterThan(0)
    })

    it.each(agents)('agent file exists: $name', ({ name, path: agentPath }) => {
      expect(fs.existsSync(agentPath), `Agent file missing: ${name} at ${agentPath}`).toBe(true)
    })
  })

  describe('skill files', () => {
    const skills = scanEntities('skill', CONFIG_DIR)

    it('finds at least one skill', () => {
      expect(skills.length).toBeGreaterThan(0)
    })

    it.each(skills)('skill SKILL.md exists: $name', ({ name, path: skillPath }) => {
      expect(fs.existsSync(skillPath), `Skill SKILL.md missing: ${name} at ${skillPath}`).toBe(true)
    })
  })

  describe('tool files', () => {
    const toolsDir = path.join(CONFIG_DIR, 'tools')
    const toolFiles = fs.existsSync(toolsDir)
      ? fs.readdirSync(toolsDir).filter((f) => f.endsWith('.ts')).map((f) => ({
          name: f.replace(/\.ts$/, ''),
          path: path.join(toolsDir, f),
        }))
      : []

    it('finds at least one tool file', () => {
      expect(toolFiles.length).toBeGreaterThan(0)
    })

    it.each(toolFiles)('tool file exists: $name', ({ name, path: toolPath }) => {
      expect(fs.existsSync(toolPath), `Tool file missing: ${name} at ${toolPath}`).toBe(true)
    })
  })

  describe('rule files', () => {
    const rulesDir = path.join(CONFIG_DIR, 'rules')
    const ruleFiles = fs.existsSync(rulesDir)
      ? fs.readdirSync(rulesDir).filter((f) => f.endsWith('.md')).map((f) => ({
          name: f.replace(/\.md$/, ''),
          path: path.join(rulesDir, f),
        }))
      : []

    it('finds at least one rule file', () => {
      expect(ruleFiles.length).toBeGreaterThan(0)
    })

    it.each(ruleFiles)('rule file exists: $name', ({ name, path: rulePath }) => {
      expect(fs.existsSync(rulePath), `Rule file missing: ${name} at ${rulePath}`).toBe(true)
    })
  })
})
