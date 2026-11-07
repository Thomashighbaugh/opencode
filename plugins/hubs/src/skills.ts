/**
 * skills.ts — the hub-owned skill corpus, plus the sidebar's derived views.
 *
 * Everything here is pure filesystem work over `../data/skills` and the hub
 * specs: no OpenCode SDK, so the TUI panel, the server registration, the MCP
 * adapter, and the tests all read the same source.
 */

import fs from "node:fs"
import path from "node:path"

import { hubNames, loadHub } from "./core"

export interface VendoredSkill {
  id: string
  name: string
  description: string
  path: string
  content: string
  /** Estimated tokens for one listing entry (id + name + description). */
  listTokens: number
  /** Estimated tokens added when the body is loaded. */
  loadTokens: number
  /** Hubs that cite this skill in at least one subcommand. */
  hubs: string[]
}

const COMPACT = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 })

export function estimateTokens(text: string): number {
  return Math.ceil(Buffer.byteLength(text, "utf8") / 4)
}

export function formatTokenCount(tokens: number): string {
  return COMPACT.format(tokens).toLowerCase()
}

export function skillsRoot(): string {
  return path.join(__dirname, "..", "data", "skills")
}

function frontmatter(content: string): Record<string, string> {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(content)
  if (!match) return {}
  const out: Record<string, string> = {}
  for (const line of match[1]!.split(/\r?\n/)) {
    const entry = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line)
    if (entry) out[entry[1]!] = entry[2]!.trim().replace(/^["']|["']$/g, "")
  }
  return out
}

/** skill id → hubs that reference it, derived from the vendored specs. */
export function skillHubMap(): Map<string, string[]> {
  const map = new Map<string, string[]>()
  for (const name of hubNames()) {
    const definition = loadHub(name)
    if (!definition) continue
    for (const sub of definition.subcommands) {
      if (!sub.skill) continue
      const hubs = map.get(sub.skill) ?? []
      if (!hubs.includes(name)) hubs.push(name)
      map.set(sub.skill, hubs)
    }
  }
  return map
}

let cache: VendoredSkill[] | null = null

export function loadVendoredSkills(): VendoredSkill[] {
  if (cache) return cache

  const root = skillsRoot()
  if (!fs.existsSync(root)) {
    cache = []
    return cache
  }

  const references = skillHubMap()
  const skills: VendoredSkill[] = []

  for (const id of fs.readdirSync(root).sort()) {
    const directory = path.join(root, id)
    const file = path.join(directory, "SKILL.md")
    if (!fs.existsSync(file)) continue
    const content = fs.readFileSync(file, "utf-8")
    const meta = frontmatter(content)
    const name = meta.name || id
    const description = meta.description || ""
    skills.push({
      id,
      name,
      description,
      path: file,
      content,
      listTokens: estimateTokens(`${id} ${name} ${description}`),
      loadTokens: estimateTokens(content),
      hubs: references.get(id) ?? [],
    })
  }

  cache = skills
  return skills
}

export function invalidateSkills(): void {
  cache = null
}

export type SkillScope = "all" | "loaded" | "hubs"

export function visibleSkills(scope: SkillScope, loaded: ReadonlySet<string>): VendoredSkill[] {
  const all = loadVendoredSkills()
  const filtered =
    scope === "loaded" ? all.filter((skill) => loaded.has(skill.id)) : scope === "hubs" ? all.filter((skill) => skill.hubs.length > 0) : all
  return [...filtered].sort((left, right) => {
    const byLoad = Number(loaded.has(right.id)) - Number(loaded.has(left.id))
    return byLoad !== 0 ? byLoad : left.id.localeCompare(right.id)
  })
}

/**
 * Extract skill ids implied by session messages. Shape-tolerant: a missing or
 * renamed field degrades to "nothing loaded", never to a throw.
 */
export function extractLoadedSkills(messages: readonly unknown[]): Set<string> {
  const loaded = new Set<string>()
  const visit = (value: unknown): void => {
    if (Array.isArray(value)) {
      for (const item of value) visit(item)
      return
    }
    if (typeof value !== "object" || value === null) return
    const record = value as Record<string, unknown>

    const toolName = typeof record.tool === "string" ? record.tool : typeof record.name === "string" ? record.name : undefined
    const tool = typeof record.tool === "string" ? record.tool : undefined
    if (toolName === "skill") {
      const input = (record.input ?? record.args ?? record.state ?? {}) as Record<string, unknown>
      const id = typeof input.id === "string" ? input.id : typeof input.name === "string" ? input.name : undefined
      if (id) loaded.add(id.replace(/^skill[:/]/, ""))
    }
    if (tool === "skill" && typeof record.output === "string") {
      const match = /skill[:/]([A-Za-z0-9._-]+)/.exec(record.output)
      if (match) loaded.add(match[1]!)
    }
    for (const child of Object.values(record)) visit(child)
  }
  visit(messages)
  return loaded
}

export function totalTokens(skills: readonly VendoredSkill[]): number {
  return skills.reduce((sum, skill) => sum + skill.listTokens + skill.loadTokens, 0)
}
