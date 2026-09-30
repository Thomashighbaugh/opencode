import * as fs from "fs"
import * as path from "path"
import { scanDir } from "./state-utils"

// ─── Types ───────────────────────────────────────────────────────────────

/** Identity slice — what the hub menu/routing view needs (small payload) */
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

/** Full per-subcommand spec — loaded only when this subcommand is selected.
 *  Contains the exhaustive pattern/action description + tool/rule references.
 *  Lives in tools/hubs/<hub>/<subcommand>.ts */
export interface HubSubcommandSpec extends HubSubcommand {
  /** Full pattern/action explanation (1-3 paragraphs): when to use, step-by-step, outputs, state location */
  detailedDescription: string
  /** Tools this subcommand uses, e.g. ["websearch", "webfetch", "loadSkill"] */
  tools?: string[]
  /** Rules to inline into the routed payload, e.g. ["completion-guardrail", "security"] */
  rules?: string[]
  /** Additional skills to load for context (beyond the primary `skill`) */
  relatedSkills?: string[]
  /** Non-obvious usage examples */
  examples?: Array<{ input: string; approach: string }>
  /** Warnings (e.g. "⚠️ EXPENSIVE: ~10× cost") */
  warnings?: string[]
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
// Menus are topical and carry a `-hub` suffix so they never collide with OpenCode's
// built-in slash commands (e.g. `/git`, `/plan`, `/build`).

export const HUB_FILE_MAP: Record<string, string> = {
  // The project-config front door: set up and refresh a project's .opencode/.
  // First, because it is where a new project starts. Renamed from `scaffold-hub`
  // — "scaffold" named one phase of the job and hid the other eleven.
  "hub-setup": "./hub-hub-setup",
  "resource-hub": "./hub-resource-hub",
  "memory-hub": "./hub-memory-hub",
  "research-hub": "./hub-research-hub",
  "design-hub": "./hub-design-hub",
  "ideate-hub": "./hub-ideate-hub",
  "plan-hub": "./hub-plan-hub",
  "verify-hub": "./hub-verify-hub",
  "swarm-hub": "./hub-swarm-hub",
  "build-hub": "./hub-build-hub",
  "orchestrate-hub": "./hub-orchestrate-hub",
  "git-hub": "./hub-git-hub",
  "maintain-hub": "./hub-maintain-hub",
  "skills-hub": "./hub-skills-hub",
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

// ─── Subcommand Spec Loader ──────────────────────────────────────────────
// Loads the HubSubcommandSpec (detailedDescription, tools, rules names, relatedSkills, etc.)
// from tools/hubs/<hub>/<subcommand>.ts. Only called when a subcommand is
// explicitly selected — NOT for menu/routing views.
//
// loadSubcommandSpec: returns just the spec (names, not inlined content)
// loadSubcommandSpecFull: also inlines rule file content + skill frontmatter

const SUBCOMMAND_DIR_MAP: Record<string, string> = {
  "hub-setup": "hub-setup",
  "resource-hub": "resource-hub",
  "memory-hub": "memory-hub",
  "research-hub": "research-hub",
  "design-hub": "design-hub",
  "ideate-hub": "ideate-hub",
  "plan-hub": "plan-hub",
  "verify-hub": "verify-hub",
  "swarm-hub": "swarm-hub",
  "build-hub": "build-hub",
  "orchestrate-hub": "orchestrate-hub",
  "git-hub": "git-hub",
  "maintain-hub": "maintain-hub",
  "skills-hub": "skills-hub",
}

// ─── Legacy Route Map ──────────────────────────────────────────────────
// The pre-2026-09-28 menus (init-project / ideation / orchestrate /
// harvest-context / project / skills) were split into 14 topical `-hub` menus.
// Old `<hub> <subcommand>` invocations still resolve, so muscle memory and any
// saved prompt keeps working. Keyed "oldHub/oldSub" -> "newHub/newSub".
//
// Entries removed outright (no redirect):
//   project/pt-review, project/pt-audit, project/pt-debt, project/pt-gain
//     — ponytail pattern, retired.
//   orchestrate/deep — exact duplicate of ideation/deep-dive.

// Exported so the invariant "every legacy route points at a hub that exists" is
// testable. A rename that leaves a route aimed at a deleted hub otherwise fails
// only when a user types the old name.
export const LEGACY_ROUTE_MAP: Record<string, string> = {
  "init-project/config": "hub-setup/config",  "init-project/detect": "hub-setup/detect",
  "init-project/doctor": "hub-setup/doctor",  "init-project/map-codebase": "hub-setup/map-codebase",
  "init-project/provision": "hub-setup/provision",  "init-project/recommend": "hub-setup/recommend",
  "init-project/refresh": "hub-setup/refresh",  "init-project/reset": "hub-setup/reset",
  "init-project/setup": "hub-setup/setup",  "init-project/tag": "hub-setup/tag",
  "init-project/verify": "hub-setup/verify",  "init-project/status": "hub-setup/status",
  "init-project/config-orchestrator": "resource-hub/config-orchestrator",  "init-project/find-agents": "resource-hub/find-agents",
  "init-project/find-rules": "resource-hub/find-rules",  "init-project/find-skills": "resource-hub/find-skills",
  "init-project/find-tools": "resource-hub/find-tools",  "init-project/context": "memory-hub/capture",
  "init-project/convention-extractor": "research-hub/convention-extractor",  "init-project/docs": "design-hub/docs",
  // scaffold-hub was erased into hub-setup. Its subcommands were identical, so
  // every one of them routes straight across — no dropped entries.
  "scaffold-hub/config": "hub-setup/config",  "scaffold-hub/detect": "hub-setup/detect",
  "scaffold-hub/doctor": "hub-setup/doctor",  "scaffold-hub/map-codebase": "hub-setup/map-codebase",
  "scaffold-hub/provision": "hub-setup/provision",  "scaffold-hub/recommend": "hub-setup/recommend",
  "scaffold-hub/refresh": "hub-setup/refresh",  "scaffold-hub/reset": "hub-setup/reset",
  "scaffold-hub/setup": "hub-setup/setup",  "scaffold-hub/tag": "hub-setup/tag",
  "scaffold-hub/verify": "hub-setup/verify",  "scaffold-hub/status": "hub-setup/status",
  "ideation/adversarial-debate": "ideate-hub/adversarial-debate",  "ideation/brainstorm": "ideate-hub/brainstorm",
  "ideation/cleanroom": "ideate-hub/cleanroom",  "ideation/ddd": "ideate-hub/ddd",
  "ideation/deep": "ideate-hub/interview",  "ideation/deep-dive": "ideate-hub/deep-dive",
  "ideation/deep-thinker": "ideate-hub/deep-thinker",  "ideation/double-diamond": "ideate-hub/double-diamond",
  "ideation/event-storming": "ideate-hub/event-storming",  "ideation/grill": "ideate-hub/grill",
  "ideation/opro": "ideate-hub/opro",  "ideation/pwf": "ideate-hub/pwf",
  "ideation/refine": "ideate-hub/refine",  "ideation/rpikit": "ideate-hub/rpikit",
  "ideation/spark": "ideate-hub/spark",  "ideation/tree-of-thoughts": "ideate-hub/tree-of-thoughts",
  "ideation/bottom-up": "plan-hub/bottom-up",  "ideation/constitution": "plan-hub/constitution",
  "ideation/decomposition": "plan-hub/decomposition",  "ideation/impact-mapping": "plan-hub/impact-mapping",
  "ideation/improvements": "plan-hub/improvements",  "ideation/jtbd": "plan-hub/jtbd",
  "ideation/lean-canvas": "plan-hub/lean-canvas",  "ideation/plan": "plan-hub/plan",
  "ideation/quality": "plan-hub/quality",  "ideation/ralplan": "plan-hub/ralplan",
  "ideation/requirements-analyzer": "plan-hub/requirements-analyzer",  "ideation/spiral": "plan-hub/spiral",
  "ideation/status": "plan-hub/status",  "ideation/story-mapping": "plan-hub/story-mapping",
  "ideation/top-down": "plan-hub/top-down",  "ideation/arch-prep": "design-hub/arch-prep",
  "ideation/architecture": "design-hub/architecture",  "ideation/modularity": "design-hub/modularity",
  "ideation/redesign": "design-hub/redesign",  "ideation/analyst": "research-hub/analyst",
  "ideation/analyze-patterns": "research-hub/analyze-patterns",  "ideation/competitive-analysis": "research-hub/competitive-analysis",
  "ideation/graph": "research-hub/graph",  "ideation/research": "research-hub/research",
  "ideation/tech-eval": "research-hub/tech-eval",  "ideation/web-research": "research-hub/web-research",
  "ideation/critic": "verify-hub/critic",  "ideation/overhaul": "build-hub/overhaul",
  "ideation/effort-estimator": "resource-hub/effort-estimator",  "ideation/prompt-simplifier": "resource-hub/prompt-simplifier",
  "ideation/hive": "swarm-hub/hive-plan",  "ideation/resume": "memory-hub/resume",
  "orchestrate/autopilot": "orchestrate-hub/autopilot",  "orchestrate/ccg": "orchestrate-hub/ccg",
  "orchestrate/consensus": "orchestrate-hub/consensus",  "orchestrate/evolutionary": "orchestrate-hub/evolutionary",
  "orchestrate/ralph": "orchestrate-hub/ralph",  "orchestrate/sciomc": "orchestrate-hub/sciomc",
  "orchestrate/state-machine": "orchestrate-hub/state-machine",  "orchestrate/swarm": "orchestrate-hub/swarm",
  "orchestrate/team": "orchestrate-hub/team",  "orchestrate/ultrawork": "orchestrate-hub/ultrawork",
  "orchestrate/status": "orchestrate-hub/status",  "orchestrate/cc10x": "swarm-hub/cc10x",
  "orchestrate/devin": "swarm-hub/devin",  "orchestrate/gastown": "swarm-hub/gastown",
  "orchestrate/gsd": "swarm-hub/gsd",  "orchestrate/harden": "swarm-hub/harden",
  "orchestrate/hive": "swarm-hub/hive",  "orchestrate/maestro": "swarm-hub/maestro",
  "orchestrate/metaswarm": "swarm-hub/metaswarm",  "orchestrate/pair": "swarm-hub/pair",
  "orchestrate/react": "swarm-hub/react",  "orchestrate/remediate": "swarm-hub/remediate",
  "orchestrate/ruflo": "swarm-hub/ruflo",  "orchestrate/spec-driven": "swarm-hub/spec-driven",
  "orchestrate/self-assess": "swarm-hub/self-assess",  "orchestrate/subagent-driven": "swarm-hub/subagent-driven",
  "orchestrate/plan-execute": "plan-hub/plan-execute",  "orchestrate/resume": "orchestrate-hub/resume",
  "orchestrate/scientist": "research-hub/scientist",  "orchestrate/tracer": "research-hub/tracer",
  "orchestrate/security-reviewer": "verify-hub/security-reviewer",  "orchestrate/brownfield": "build-hub/brownfield",
  "orchestrate/pipeline": "build-hub/pipeline",  "orchestrate/vibe-code": "build-hub/vibe-code",
  "orchestrate/tdd": "verify-hub/tdd",  "harvest-context/agent": "resource-hub/agent",
  "harvest-context/command": "resource-hub/command",  "harvest-context/rule": "resource-hub/rule",
  "harvest-context/skill": "resource-hub/skill",  "harvest-context/codebase": "memory-hub/codebase",
  "harvest-context/compare": "memory-hub/compare",  "harvest-context/compress": "memory-hub/compress",
  "harvest-context/consume": "memory-hub/consume",  "harvest-context/context": "memory-hub/context",
  "harvest-context/decompose": "memory-hub/decompose",  "harvest-context/diff": "memory-hub/diff",
  "harvest-context/export": "memory-hub/export",  "harvest-context/journal": "memory-hub/journal",
  "harvest-context/memory": "memory-hub/memory",  "harvest-context/prune": "memory-hub/prune",
  "harvest-context/search": "memory-hub/search",  "harvest-context/secondbrain": "memory-hub/secondbrain",
  "harvest-context/session": "memory-hub/session",  "harvest-context/sweep": "memory-hub/sweep",
  "harvest-context/web-research": "memory-hub/web-research",  "harvest-context/docs": "research-hub/library-docs",
  "project/delegate": "swarm-hub/delegate",  "project/commit": "git-hub/commit",
  "project/commit-drafter": "git-hub/commit-drafter",  "project/git-stage-thread": "git-hub/git-stage-thread",
  "project/git-cleanup": "git-hub/git-cleanup",  "project/git-master": "git-hub/git-master",
  "project/pr": "git-hub/pr",  "project/gh": "git-hub/gh",
  "project/release": "git-hub/release",  "project/changelog": "git-hub/changelog",
  "project/archive": "git-hub/archive",  "project/executor": "build-hub/executor",
  "project/cleanup": "build-hub/cleanup",  "project/modernize": "build-hub/modernize",
  "project/optimize": "build-hub/optimize",  "project/refactor": "build-hub/refactor",
  "project/simplify": "build-hub/simplify",  "project/simplify-code": "build-hub/simplify-code",
  "project/extract-standards": "build-hub/extract-standards",  "project/code-review": "verify-hub/code-review",
  "project/review": "verify-hub/review",  "project/audit": "verify-hub/audit",
  "project/create-tests": "verify-hub/create-tests",  "project/test-engineer": "verify-hub/test-engineer",
  "project/qa-tester": "verify-hub/qa-tester",  "project/debugger": "verify-hub/debugger",
  "project/deep-bug-hunt": "verify-hub/deep-bug-hunt",  "project/designer": "design-hub/designer",
  "project/frontend-design": "design-hub/frontend-design",  "project/readme": "design-hub/readme",
  "project/writer": "design-hub/writer",  "project/explore": "research-hub/explore",
  "project/document-specialist": "research-hub/document-specialist",  "project/graph": "resource-hub/knowledge-graph",
  "project/consolidate-telemetry": "maintain-hub/consolidate-telemetry",  "project/insights": "maintain-hub/insights",
  "project/self-improve": "maintain-hub/self-improve",  "project/retrospect": "maintain-hub/retrospect",
  "project/scan": "maintain-hub/scan",  "project/vectorize": "maintain-hub/vectorize",
  "project/converge": "maintain-hub/converge",  "project/icon": "maintain-hub/icon",
  "project/organize": "maintain-hub/organize",  "project/purge": "maintain-hub/purge",
  "project/sandbox": "maintain-hub/sandbox",  "project/workspace": "maintain-hub/workspace",
  "skills/add": "skills-hub/add",  "skills/create": "skills-hub/create",
  "skills/edit": "skills-hub/edit",  "skills/info": "skills-hub/info",
  "skills/list": "skills-hub/list",  "skills/package": "skills-hub/package",
  "skills/remove": "skills-hub/remove",  "skills/scan": "skills-hub/scan",
  "skills/search": "skills-hub/search",  "skills/setup": "skills-hub/setup",
  "skills/sync": "skills-hub/sync",  "skills/update": "skills-hub/update",
  "skills/validate": "skills-hub/validate",
}

// ─── Pre-compiled Spec Registry ───────────────────────────────────────
// Loads from tools/hubs/spec-registry.json (built by build-spec-registry.ts).
// Falls back to individual require() if registry is missing/stale.

const SPEC_REGISTRY_PATH = path.join(__dirname, "hubs", "spec-registry.json")
let _specRegistry: Record<string, HubSubcommandSpec> | null = null

/** Load the pre-compiled spec registry from disk. Cached after first read. */
function loadSpecRegistry(): Record<string, HubSubcommandSpec> | null {
  if (_specRegistry !== null) return _specRegistry
  try {
    if (fs.existsSync(SPEC_REGISTRY_PATH)) {
      const raw = JSON.parse(fs.readFileSync(SPEC_REGISTRY_PATH, "utf-8"))
      _specRegistry = raw as Record<string, HubSubcommandSpec>
      return _specRegistry
    }
  } catch {
    // Registry is optional — silently fall through
  }
  return null
}

/** Invalidate the cached registry (useful after rebuild). */
export function invalidateSpecRegistry(): void {
  _specRegistry = null
}

/**
 * Rewrite a legacy "<oldHub>/<oldSub>" pair onto its current "<newHub>/<newSub>" home.
 * Returns the input unchanged when it is already current or unmapped.
 */
function resolveLegacyRoute(hubName: string, subLabel: string): [string, string] {
  const mapped = LEGACY_ROUTE_MAP[`${hubName}/${subLabel}`]
  if (!mapped) return [hubName, subLabel]
  const slash = mapped.indexOf("/")
  return [mapped.slice(0, slash), mapped.slice(slash + 1)]
}

export function loadSubcommandSpec(hubName: string, subLabel: string): HubSubcommandSpec | null {
  const [hub, sub] = resolveLegacyRoute(hubName, subLabel)
  const dir = SUBCOMMAND_DIR_MAP[hub]
  if (!dir) return null

  // 1. Try pre-compiled registry first
  const registry = loadSpecRegistry()
  const registryKey = `${dir}/${sub}`
  if (registry && registry[registryKey]) {
    return registry[registryKey]
  }

  // 2. Fall back to individual require()
  const file = `./hubs/${dir}/${sub}`
  try {
    const mod = require(file)
    return (mod.default || mod.spec) as HubSubcommandSpec
  } catch {
    return null
  }
}

/** Load the full spec with inlined rule/skill content for a SPECIFIC subcommand.
 *  Used ONLY by hubMenu 'route' action — NOT by the menu view.
 *  Inlines rule files and skill metadata so the agent doesn't need follow-up calls. */
export function loadSubcommandSpecFull(hubName: string, subLabel: string): {
  spec: HubSubcommandSpec | null
  rulesContent: Array<{ name: string; content: string }>
  relatedSkillMeta: Array<{ name: string; path: string; description: string }>
} {
  const spec = loadSubcommandSpec(hubName, subLabel)
  if (!spec) return { spec: null, rulesContent: [], relatedSkillMeta: [] }

  const rulesContent: Array<{ name: string; content: string }> = []
  if (spec.rules && spec.rules.length > 0) {
    const rulesDir = path.join(__dirname, '..', 'rules')
    for (const ruleName of spec.rules) {
      const rulePath = path.join(rulesDir, `${ruleName}.md`)
      try {
        if (fs.existsSync(rulePath)) {
          rulesContent.push({ name: ruleName, content: fs.readFileSync(rulePath, 'utf-8') })
        }
      } catch {}
    }
  }

  const relatedSkillMeta: Array<{ name: string; path: string; description: string }> = []
  if (spec.relatedSkills && spec.relatedSkills.length > 0) {
    const skillsDir = path.join(__dirname, '..', 'skills')
    for (const skillName of spec.relatedSkills) {
      const skillPath = path.join(skillsDir, skillName, 'SKILL.md')
      try {
        if (fs.existsSync(skillPath)) {
          const content = fs.readFileSync(skillPath, 'utf-8')
          const fmMatch = content.match(/^---\n([\s\S]*?)\n---/)
          if (fmMatch) {
            const descMatch = fmMatch[1].match(/^description:\s*(.+)$/m)
            relatedSkillMeta.push({
              name: skillName,
              path: skillPath,
              description: descMatch ? descMatch[1].trim() : ''
            })
          }
        }
      } catch {}
    }
  }

  return { spec, rulesContent, relatedSkillMeta }
}
