import * as fs from "fs"
import * as path from "path"
import { scanDir } from "./state-utils"

// ─── Types ───────────────────────────────────────────────────────────────

export interface HubSubcommand {
  label: string
  description: string
  /** Terse 1-line reminder shown to the user when the subcommand is invoked */
  reminder: string
  skill?: string
  agent?: string
  command?: string
  inline?: boolean
  phases?: string
}

export interface HubDefinition {
  name: string
  description: string
  stateDir: string
  subcommands: HubSubcommand[]
}

export interface DelegationInfo {
  type: 'skill' | 'agent' | 'command' | 'inline'
  target: string | undefined
}

// ─── Delegation ──────────────────────────────────────────────────────────

export function getDelegation(sub: HubSubcommand): DelegationInfo {
  const types = ['skill', 'agent', 'command', 'inline'] as const
  const set = types.filter(t => !!sub[t as keyof HubSubcommand])
  if (set.length === 0) return { type: 'inline', target: undefined }
  if (set.length > 1) {
    console.warn(`Warning: Subcommand '${sub.label}' has multiple delegation types: ${set.join(', ')}. Using '${set[0]}'.`)
  }
  const type = set[0] as 'skill' | 'agent' | 'command' | 'inline'
  return { type, target: sub[type as keyof HubSubcommand] as string | undefined }
}

// ─── State Cache (5s TTL) ───────────────────────────────────────────────

const _stateCache = new Map<string, { result: Record<string, unknown>; expires: number }>()

function getCachedState(hubName: string): Record<string, unknown> | null {
  const entry = _stateCache.get(hubName)
  if (entry && Date.now() < entry.expires) return entry.result
  _stateCache.delete(hubName)
  return null
}

function setCachedState(hubName: string, result: Record<string, unknown>): void {
  _stateCache.set(hubName, { result, expires: Date.now() + 5000 })
}

// ─── Project Root ────────────────────────────────────────────────────────

let _cachedProjectRoot: string | null = null

function getProjectRoot(): string {
  if (_cachedProjectRoot) return _cachedProjectRoot
  try {
    const result = require('child_process').execSync('git rev-parse --show-toplevel 2>/dev/null', { encoding: 'utf-8' }).trim()
    if (result) { _cachedProjectRoot = result; return result }
  } catch {}
  _cachedProjectRoot = process.cwd()
  return _cachedProjectRoot
}

// ─── State Helpers ───────────────────────────────────────────────────────

export function getStateDir(hub: HubDefinition): string {
  const projectRoot = getProjectRoot()
  if (!hub.stateDir) return ""
  return path.join(projectRoot, '.opencode', 'state', hub.stateDir)
}

export function getStateInfo(hub: HubDefinition): Record<string, unknown> {
  const cached = getCachedState(hub.name)
  if (cached) return cached

  const stateDir = getStateDir(hub)
  if (!stateDir) {
    const r = { hasState: false, reason: "Hub is stateless" }
    setCachedState(hub.name, r)
    return r
  }

  if (!fs.existsSync(stateDir)) {
    const r = { hasState: false, path: stateDir }
    setCachedState(hub.name, r)
    return r
  }

  const indexPath = path.join(stateDir, 'index.json')
  if (fs.existsSync(indexPath)) {
    try {
      const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'))
      if (index && typeof index.count === 'number') {
        const r = { hasState: true, path: stateDir, files: index.files || [], count: index.count, lastUpdated: index.updated }
        setCachedState(hub.name, r)
        return r
      }
    } catch {}
  }

  const entries = scanDir(stateDir).filter(f => !f.name.endsWith('index.json')).map(f => ({ name: f.name, modified: f.mtime.toISOString(), size: 0 }))
  const r = { hasState: entries.length > 0, path: stateDir, files: entries, count: entries.length }
  setCachedState(hub.name, r)
  return r
}

export function getLatestCheckpoint(hub: HubDefinition): Record<string, unknown> | null {
  const stateDir = getStateDir(hub)
  if (!stateDir || !fs.existsSync(stateDir)) return null

  const checkpointPatterns = ['*-checkpoint.json', 'init-checkpoint.json', '*-final.md']
  for (const pattern of checkpointPatterns) {
    try {
      const entries = fs.readdirSync(stateDir)
      for (const entry of entries) {
        if (entry === 'init-checkpoint.json' || entry.endsWith('-checkpoint.json') || entry.endsWith('-final.md')) {
          const filePath = path.join(stateDir, entry)
          try {
            const content = fs.readFileSync(filePath, 'utf-8')
            const stat = fs.statSync(filePath)
            return { file: entry, path: filePath, modified: stat.mtime.toISOString(), content: entry.endsWith('.json') ? JSON.parse(content) : content.substring(0, 500) }
          } catch {}
        }
      }
    } catch {}
  }

  const workProductsDir = path.join(stateDir, 'work-products')
  if (fs.existsSync(workProductsDir)) {
    try {
      const entries = fs.readdirSync(workProductsDir).filter(f => f.endsWith('.md') || f.endsWith('.json')).sort()
      if (entries.length > 0) {
        const latest = entries[entries.length - 1]
        const stat = fs.statSync(path.join(workProductsDir, latest))
        return { file: latest, path: path.join(workProductsDir, latest), modified: stat.mtime.toISOString(), type: 'work-product' }
      }
    } catch {}
  }
  return null
}

export function updateStateIndex(stateDir: string): void {
  if (!stateDir || !fs.existsSync(stateDir)) return
  try {
    const files = scanDir(stateDir).filter(f => !f.name.endsWith('index.json')).map(f => ({ name: f.name, modified: f.mtime.toISOString(), size: 0 }))
    fs.writeFileSync(path.join(stateDir, 'index.json'), JSON.stringify({ count: files.length, files, updated: new Date().toISOString() }, null, 2))
  } catch {}
}

// ─── Hub File Registry ───────────────────────────────────────────────────
// Used by tools that need to iterate all hubs (gen-routing-docs, validate-delegation).

export const HUB_FILE_MAP: Record<string, string> = {
  "init-project": "./hub-init-project",
  "ideation": "./hub-ideation",
  "orchestrate": "./hub-orchestrate",
  "harvest-context": "./hub-harvest-context",
  "project": "./hub-project",
  "skills": "./hub-skills",
}

export function loadHub(name: string): HubDefinition | null {
  const file = HUB_FILE_MAP[name]
  if (!file) return null
  try {
    return require(file).default as HubDefinition
  } catch {
    return null
  }
}

export function loadAllHubs(): HubDefinition[] {
  const hubs: HubDefinition[] = []
  for (const name of Object.keys(HUB_FILE_MAP)) {
    const hub = loadHub(name)
    if (hub) hubs.push(hub)
  }
  return hubs
}
