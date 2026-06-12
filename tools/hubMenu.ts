import { tool } from "@opencode-ai/plugin"
import * as fs from "fs"
import * as path from "path"
import { homedir } from "os"

const USER_CONFIG_DIR = process.env.OPENCODE_CONFIG_DIR || path.join(homedir(), '.config', 'opencode')

interface HubSubcommand {
  label: string
  description: string
  skill?: string
  agent?: string
  command?: string
  inline?: boolean
  reminder: string
  phases?: string
}

interface HubDefinition {
  name: string
  description: string
  stateDir: string
  subcommands: HubSubcommand[]
}

const HUBS: HubDefinition[] = [
  {
    name: "init-project",
    description: "Initialize or refine project setup",
    stateDir: "init",
    subcommands: [
      { label: "setup", description: "Full project setup — global Hubs verify, detection, scaffold, provision agents/tools, docs, context, routing, verify", skill: "init-project", reminder: "Full project init: verify, detect, scaffold, docs, validate.", phases: "0-8" },
      { label: "detect", description: "Detect language, framework, build tools, and key directories", agent: "explore", reminder: "Detect language, framework, and build tools.", phases: "0-1" },
      { label: "docs", description: "Generate hierarchical AGENTS.md documentation across the codebase", skill: "deepinit", reminder: "Generate hierarchical AGENTS.md documentation.", phases: "4" },
      { label: "context", description: "Capture session knowledge, promote insights to project memory and docs", skill: "remember", reminder: "Capture session knowledge for project memory.", phases: "5" },
      { label: "verify", description: "Validate configuration completeness, file existence, and reference integrity", agent: "verifier", reminder: "Validate configuration completeness and integrity.", phases: "7" },
      { label: "refresh", description: "Update existing configuration — preserve manual edits, merge new detections", skill: "init-project", reminder: "Update config preserving manual edits.", phases: "0-8 (merge)" },
      { label: "status", description: "Show current initialization state and checkpoint progress", inline: true, reminder: "Show init state and checkpoint progress." },
      { label: "map-codebase", description: "Analyze existing brownfield codebase — spawn parallel agents to map stack, architecture, conventions, and integration points before init", inline: true, reminder: "Map codebase via parallel agent analysis." },
      { label: "doctor", description: "Run diagnostic health check — validate Hubs installation, config integrity, state consistency, and hook status", inline: true, reminder: "Run Hubs health diagnostics." },
      { label: "reset", description: "Reset project state — archive .opencode/state and .opencode/context, start fresh with clean slate", inline: true, reminder: "Reset project state with clean slate." },
      { label: "provision", description: "Analyze codebase and auto-generate project-specific agents, skills, tools, and rules in .opencode/", skill: "provision", reminder: "Provision project-aware agents, skills, tools, and rules from codebase analysis." }
    ]
  },
  {
    name: "ideation",
    description: "Planning, research, and ideation hub",
    stateDir: "ideation",
    subcommands: [
      { label: "plan", description: "Interview-style strategic planning — clarify goals, break into tasks", skill: "plan", reminder: "Strategic planning: clarify goals → ordered tasks." },
      { label: "brainstorm", description: "Free-form idea generation — throw ideas at the wall on any topic, then cluster and prioritize", inline: true, reminder: "Generate, cluster, and prioritize ideas." },
      { label: "decomposition", description: "Decompose a task into actionable subtasks — break complex work into ordered, verifiable steps", inline: true, reminder: "Break complex tasks into actionable subtasks." },
      { label: "refine", description: "Diverge/converge iteration — expand ideas, then sharpen them", skill: "idea-refine", reminder: "Diverge and converge to sharpen ideas." },
      { label: "deep", description: "Socratic interview with ambiguity gating — crystallize vague requirements", skill: "deep-interview", reminder: "Socratic interview to crystallize requirements." },
      { label: "graph", description: "Visual relationship mapping — dependencies, components, tradeoffs", skill: "graph-thinking", reminder: "Map relationships as visual graphs." },
      { label: "research", description: "Multi-model synthesis — diverse perspectives merged into one answer", skill: "ccg", reminder: "Synthesize diverse model perspectives." },
      { label: "ralplan", description: "Consensus planning gate — validate plan is concrete enough to execute", skill: "ralplan", reminder: "Validate plan concreteness via consensus." },
      { label: "ddd", description: "Domain-driven design — model bounded contexts, aggregates, domain events", inline: true, reminder: "Model bounded contexts and domain events." },
      { label: "event-storming", description: "Collaborative domain exploration via timeline, commands, events, policies", inline: true, reminder: "Explore domain via event timeline." },
      { label: "double-diamond", description: "Design Council framework — discover, define, develop, deliver", inline: true, reminder: "Discover, define, develop, deliver." },
      { label: "jtbd", description: "Jobs-to-be-done — frame requirements around customer functional jobs", inline: true, reminder: "Frame requirements around customer jobs." },
      { label: "impact-mapping", description: "Why-who-how-what goal mapping — trace deliverables to business impact", inline: true, reminder: "Map goals to business impact." },
      { label: "spiral", description: "Risk-driven iterative planning — each cycle targets highest-risk items first", inline: true, reminder: "Risk-driven iterative planning cycles." },
      { label: "top-down", description: "Decompose from high-level vision into components and sub-systems", inline: true, reminder: "Decompose vision into components top-down." },
      { label: "bottom-up", description: "Build up from existing primitives and capabilities into composed systems", inline: true, reminder: "Compose systems from existing primitives." },
      { label: "adversarial-debate", description: "Spec validation via oppositional debate — proposer vs security/performance critics with judge convergence", inline: true, reminder: "Validate specs via adversarial debate." },
      { label: "cleanroom", description: "Formal correctness with box structures — black box → state box → clear box, statistical usage testing, MTTF certification", inline: true, reminder: "Formal correctness via box structures." },
      { label: "pwf", description: "Planning-with-files — treat filesystem as disk, context window as RAM; three-file pattern with quality-gated convergence and session recovery", inline: true, reminder: "Plan with files as persistent disk." },
      { label: "rpikit", description: "Research-Plan-Implement with stakes-based rigor scaling and 'Iron Law' — don't touch code until problem is understood", inline: true, reminder: "Research-Plan-Implement with stakes rigor." },
      { label: "hive", description: "Agent Hive planning — Architect Bee phase: interview, discover, context-gather, produce plan.md with approval gate before execution", inline: true, reminder: "Architect Bee: plan with approval gate." },
      { label: "story-mapping", description: "User story mapping — arrange features along a user journey spine, prioritize by release for iterative delivery", inline: true, reminder: "Map features along user journey." },
      { label: "lean-canvas", description: "Lean business model canvas — one-page framework for problem, solution, key metrics, and competitive advantage", inline: true, reminder: "One-page lean business model canvas." },
      { label: "constitution", description: "Establish project governance — code quality, UX, performance, and security principles as input to spec-driven work", inline: true, reminder: "Establish project governance principles." },
      { label: "resume", description: "Resume last ideation session", inline: true, reminder: "Resume last ideation session." },
      { label: "status", description: "Show current ideation state", inline: true, reminder: "Show ideation state." }
    ]
  },
  {
    name: "orchestrate",
    description: "Execution hub — pick an orchestration pattern, load a plan, and build",
    stateDir: "orchestration",
    subcommands: [
      { label: "ralph", description: "Persistent loop — keeps working until task is verified complete", skill: "ralph", reminder: "Persistent loop until verified complete." },
      { label: "team", description: "N coordinated agents with shared task list and real-time messaging", skill: "team", reminder: "N coordinated agents on shared tasks." },
      { label: "deep", description: "2-stage: causal trace → deep interview to crystallize requirements", skill: "deep-dive", reminder: "Trace root cause, then crystallize requirements." },
      { label: "ccg", description: "Multi-model synthesis — query diverse models, merge perspectives", skill: "ccg", reminder: "Synthesize multiple model perspectives." },
      { label: "ultrawork", description: "Maximum parallel execution for high-throughput tasks", skill: "ultrawork", reminder: "Execute all independent tasks in parallel." },
      { label: "autopilot", description: "Full autonomous execution from idea to working code", skill: "autopilot", reminder: "From idea to working code autonomously." },
      { label: "sciomc", description: "Parallel scientist agents for comprehensive analysis", skill: "sciomc", reminder: "Parallel scientist agents for analysis." },
      { label: "swarm", description: "Architect-led team of 11 specialized agents with gated QA pipeline", skill: "opencode-swarm", reminder: "Architect-led swarm with gated QA." },
      { label: "state-machine", description: "State-machine orchestration — agents as states with explicit transitions and guards", inline: true, reminder: "Model workflow as state machine." },
      { label: "consensus", description: "Multi-agent consensus/voting — run agents independently, resolve via majority, weighting, or synthesis", inline: true, reminder: "Multi-agent consensus and voting." },
      { label: "evolutionary", description: "Evolutionary delivery — incremental builds with fitness validation at each generation", inline: true, reminder: "Incremental builds with fitness validation." },
      { label: "spec-driven", description: "Spec-first development — formalize spec, validate it, then implement against it", inline: true, reminder: "Spec-first: formalize, validate, implement." },
      { label: "react", description: "ReAct pattern — interleaved Reasoning and Acting: think → act → observe → reason → repeat until goal met", inline: true, reminder: "ReAct loop: think, act, observe, repeat." },
      { label: "plan-execute", description: "Classic plan-then-execute — architect builds complete plan, executor implements step by step", inline: true, reminder: "Plan first, then execute step by step." },
      { label: "hive", description: "Agent Hive execution — Swarm Bee phase: batched parallelism with worktree isolation, best-effort worker verification, blocked worker protocol, orchestrator batch testing", inline: true, reminder: "Swarm Bee: batched parallel execution." },
      { label: "tdd", description: "Test-driven development loop — red-green-refactor: write failing test, make it pass, refactor, repeat until all features covered", inline: true, reminder: "Red-green-refactor TDD loop." },
      { label: "pair", description: "Pair programming — two agents on one task: Driver writes code, Navigator reviews in real-time, catching mistakes early", inline: true, reminder: "Driver/Navigator pair programming." },
      { label: "pipeline", description: "Declarative multi-stage pipeline — Stage 1: lint → Stage 2: test → Stage 3: build → Stage 4: deploy, each stage gates the next", inline: true, reminder: "Multi-stage pipeline with hard gates." },
      { label: "gsd", description: "Get Shit Done pipeline — discuss → plan → execute → verify → ship with wave-based parallel execution, fresh context per task, and atomic commits", inline: true, reminder: "Discuss→plan→execute→verify→ship pipeline." },
      { label: "self-assess", description: "Iterative self-evaluation — agent executes, critically evaluates against quality thresholds, reflects and refines until targets met", inline: true, reminder: "Self-evaluate and iterate until quality met." },
      { label: "remediate", description: "CI/build failure auto-remediation — monitor failures, analyze root causes, auto-apply fixes, re-run until green", inline: true, reminder: "Auto-remediate build failures until green." },
      { label: "devin", description: "Autonomous Plan→Code→Debug→Deploy pipeline with iterative debugging cycles and root-cause analysis loops", inline: true, reminder: "Plan→Code→Debug→Deploy pipeline." },
      { label: "maestro", description: "Strict role separation — PMs gather requirements, Architects design/review (never code), Coders implement/test (never self-review)", inline: true, reminder: "Strict role separation factory." },
      { label: "metaswarm", description: "Autonomous issue-to-PR with 12 agents, 7 phases, adversarial reviews with fresh reviewers to block anchoring bias", inline: true, reminder: "12-agent autonomous issue-to-PR pipeline." },
      { label: "cc10x", description: "Intent-detecting router → dispatches to BUILD/DEBUG/REVIEW/PLAN workflows with evidence-first validation and confidence gating", inline: true, reminder: "Intent-detecting workflow router." },
      { label: "gastown", description: "GUPP principle — 'if work on your hook, YOU MUST RUN IT' with git-backed work units and NDI for reliable outcomes from unreliable processes", inline: true, reminder: "Git-backed work units with GUPP principle." },
      { label: "ruflo", description: "60+ agent swarm with Q-Learning smart routing, 4 consensus protocols, and Queen/Worker hierarchical topologies", inline: true, reminder: "60+ agent swarm with Q-Learning." },
      { label: "harden", description: "Composable robustness — safeTask (error+deviation tracking), circuitBreaker (halt on failure rate), verificationGate (block downstream until verified)", inline: true, reminder: "Wrap workflow with robustness composables." },
      { label: "brownfield", description: "Feature addition to existing codebase — analyze system, identify integration points, validate strategy before implementation", inline: true, reminder: "Analyze and integrate into existing codebase." },
      { label: "vibe-code", description: "Conversational rapid prototyping — describe app in natural language, generate full-stack, iterate with feedback through conversational rounds", inline: true, reminder: "Conversational rapid prototyping." },
      { label: "resume", description: "Resume last orchestration session", inline: true, reminder: "Resume last orchestration session." },
      { label: "status", description: "Show current orchestration state", inline: true, reminder: "Show orchestration state." }
    ]
  },
  {
    name: "harvest-context",
    description: "Context and artifact hub — extract, generate, and manage project context",
    stateDir: "harvest",
    subcommands: [
      { label: "session", description: "Extract decisions, patterns, learnings from current session", inline: true, reminder: "Extract decisions and patterns from session." },
      { label: "codebase", description: "Generate hierarchical AGENTS.md across the codebase", skill: "deepinit", reminder: "Generate hierarchical AGENTS.md documentation." },
      { label: "skill", description: "Create a reusable skill from session knowledge", skill: "skill-creator", reminder: "Extract a repeatable workflow as a skill." },
      { label: "agent", description: "Create a project-specific agent", skill: "opencode-agent-creator", reminder: "Create a project-specific agent." },
      { label: "rule", description: "Create a project rule (.opencode/rules/)", inline: true, reminder: "Create a project rule file." },
      { label: "command", description: "Create a project slash command", skill: "opencode-command-creator", reminder: "Create a project slash command." },
      { label: "memory", description: "Promote durable knowledge to project memory, notepad, or wiki", skill: "remember", reminder: "Promote knowledge to memory or wiki." },
      { label: "docs", description: "Fetch official library documentation for any package", inline: true, reminder: "Fetch library docs via Context7 MCP." },
      { label: "decompose", description: "Break down a concept or goal into smaller actionable units", agent: "planner", reminder: "Decompose concept into actionable tasks." },
      { label: "context", description: "Manage context files — harvest, extract, organize, compact, map", inline: true, reminder: "Harvest, organize, or compact context." },
      { label: "consume", description: "Ingest a file, directory, or URL — extract text content and save as durable context in .opencode/context/research/", inline: true, reminder: "Ingest and save content as durable context." },
      { label: "compress", description: "Token compression strategies — density filtering (~29% savings), command output compression (~47%), library cache compression (~94%)", inline: true, reminder: "Apply 4-layer token compression." },
      { label: "secondbrain", description: "Privacy-first local knowledge base — markdown+Git with role packs and self-healing cross-references", inline: true, reminder: "Set up local-first knowledge management." },
      { label: "journal", description: "Event-sourced journal for orchestration runs — deterministic replay, time-travel debugging, SHA-256 checksums", inline: true, reminder: "Set up event-sourced orchestration journal." },
      { label: "search", description: "Semantic search across all context files — find decisions, patterns, research matching a query across .opencode/context/", inline: true, reminder: "Semantic search across context files." },
      { label: "prune", description: "Stale context management — identify old or superseded context files, archive or delete them to keep .opencode/context/ healthy", inline: true, reminder: "Identify and archive stale context files." },
      { label: "export", description: "Export context as a readable summary, markdown bundle, or team report — share what the project knows", inline: true, reminder: "Export context as readable summary." },
      { label: "diff", description: "Context diff — compare current context state to a previous checkpoint, showing new decisions, patterns, and changes since last harvest", inline: true, reminder: "Diff context against previous checkpoint." }
    ]
  },
  {
    name: "project",
    description: "Project operations hub — tests, git workflows, optimization, icons, changelogs, and file organization",
    stateDir: "",
    subcommands: [
      { label: "tests", description: "Generate comprehensive 8-type test suite", command: "create-tests", reminder: "Generate comprehensive 8-type test suite." },
      { label: "commit", description: "Create well-formatted conventional commit", skill: "conventional-commit", reminder: "Create conventional commit with staged changes." },
      { label: "stage", description: "Stage git changes from current conversation thread", command: "git-stage-thread", reminder: "Stage files changed in conversation." },
      { label: "pr", description: "Create, view, merge, or manage pull requests", command: "pr", reminder: "Manage pull requests via GitHub CLI." },
      { label: "gh", description: "Full GitHub CLI operations via gh", skill: "github-ops", reminder: "Run GitHub CLI operations." },
      { label: "optimize", description: "Analyze and optimize code for performance/security", command: "optimize", reminder: "Optimize code performance and security." },
      { label: "icon", description: "Generate web/PWA/UE icon assets from source image", skill: "icon-generator", reminder: "Generate icon assets from source image." },
      { label: "organize", description: "Find duplicates, suggest structures, automate cleanup", skill: "file-organizer", reminder: "Find duplicates and organize files." },
      { label: "analyze", description: "Analyze code patterns in the codebase", command: "analyze-patterns", reminder: "Analyze codebase patterns and anti-patterns." },
      { label: "changelog", description: "Generate user-facing changelog from git commits", skill: "changelog-generator", reminder: "Generate changelog from git commits." },
      { label: "converge", description: "5-gate quality convergence — functional tests, lint/complexity, type safety, security scanning, performance thresholds with progressive target escalation", inline: true, reminder: "Run 5-gate quality convergence." },
      { label: "scan", description: "Security vulnerability scan — SAST rules, secrets detection, dependency audit, compliance checks", inline: true, reminder: "Run security vulnerability scan." },
      { label: "sandbox", description: "Sandbox enforcement — policy-based tool control, file protection, network filtering for agent tool calls", inline: true, reminder: "Enforce sandbox tool execution policies." },
      { label: "retrospect", description: "Post-run retrospective analysis — extract lessons learned, error taxonomy classification, metrics across all phases", inline: true, reminder: "Run post-run retrospective analysis." },
      { label: "purge", description: "Clean up stale orchestration state — remove old runs, free disk space, preserve recent history", inline: true, reminder: "Purge stale orchestration state." },
      { label: "release", description: "Tag and release — bump version, generate changelog, create GitHub release in one flow", inline: true, reminder: "Tag, bump, and create GitHub release." },
      { label: "review", description: "Full code review round — analyze recent changes, run security scan, check complexity, produce a review report", inline: true, reminder: "Run full code review round." },
      { label: "audit", description: "Comprehensive project health check — dependencies, security, code quality, test coverage, bundle size in one command", inline: true, reminder: "Run comprehensive project health audit." },
      { label: "archive", description: "Move stale branches, old artifacts, unused config to timestamped archive — keep working tree clean", inline: true, reminder: "Archive stale branches and artifacts." },
      { label: "workspace", description: "Manage .opencode across projects — list Hubs-enabled projects, sync config, init .opencode in new directories, check health", inline: true, reminder: "Manage Hubs workspace across projects." }
    ]
  }
]

// ─── In-Memory Route Cache ─────────────────────────────────────────────
// Caches hubMenu route results to avoid redundant tool execution overhead.
// Key: `${hub}:${subcommand}` — invalidated by process restart (intentional).
const _routeCache = new Map<string, string>()

function getProjectRoot(): string {
  try {
    const result = require('child_process').execSync('git rev-parse --show-toplevel 2>/dev/null', { encoding: 'utf-8' }).trim()
    if (result) return result
  } catch {}
  return process.cwd()
}

function getStateDir(hub: HubDefinition): string {
  const projectRoot = getProjectRoot()
  if (!hub.stateDir) return ""
  return path.join(projectRoot, '.opencode', 'state', hub.stateDir)
}

function getStateInfo(hub: HubDefinition): Record<string, unknown> {
  const stateDir = getStateDir(hub)
  if (!stateDir) {
    return { hasState: false, reason: "Hub is stateless" }
  }

  // Lazy check — don't create directories, don't scan recursively on every call
  if (!fs.existsSync(stateDir)) {
    return { hasState: false, path: stateDir }
  }

  // Single index file per hub if available (avoids recursive scan)
  const indexPath = path.join(stateDir, 'index.json')
  if (fs.existsSync(indexPath)) {
    try {
      const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'))
      if (index && typeof index.count === 'number') {
        return {
          hasState: true,
          path: stateDir,
          files: index.files || [],
          count: index.count,
          lastUpdated: index.updated
        }
      }
    } catch {}
  }

  // Fallback: recursive scan (only if no index file)
  const files: Array<{name: string; modified: string; size: number}> = []
  try {
    for (const entry of fs.readdirSync(stateDir, { recursive: true, withFileTypes: false })) {
      const filePath = path.join(stateDir, entry as string)
      try {
        const stat = fs.statSync(filePath)
        if (stat.isFile() && !(entry as string).endsWith('index.json')) {
          files.push({
            name: entry as string,
            modified: stat.mtime.toISOString(),
            size: stat.size
          })
        }
      } catch {}
    }
  } catch {}

  return {
    hasState: files.length > 0,
    path: stateDir,
    files: files.sort((a, b) => b.modified.localeCompare(a.modified)),
    count: files.length
  }
}

// ─── State Index Updater ───────────────────────────────────────────────
// Called after state writes to keep a lightweight index (avoids full directory scan).
function updateStateIndex(stateDir: string): void {
  if (!stateDir || !fs.existsSync(stateDir)) return
  try {
    const files: Array<{name: string; modified: string; size: number}> = []
    for (const entry of fs.readdirSync(stateDir, { recursive: true, withFileTypes: false })) {
      const filePath = path.join(stateDir, entry as string)
      try {
        const stat = fs.statSync(filePath)
        if (stat.isFile() && !(entry as string).endsWith('index.json')) {
          files.push({ name: entry as string, modified: stat.mtime.toISOString(), size: stat.size })
        }
      } catch {}
    }
    const sorted = files.sort((a, b) => b.modified.localeCompare(a.modified))
    fs.writeFileSync(path.join(stateDir, 'index.json'), JSON.stringify({
      count: sorted.length,
      files: sorted,
      updated: new Date().toISOString()
    }, null, 2))
  } catch {}
}

function getLatestCheckpoint(hub: HubDefinition): Record<string, unknown> | null {
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
            return {
              file: entry,
              path: filePath,
              modified: stat.mtime.toISOString(),
              content: entry.endsWith('.json') ? JSON.parse(content) : content.substring(0, 500)
            }
          } catch {}
        }
      }
    } catch {}
  }

  const workProductsDir = path.join(stateDir, 'work-products')
  if (fs.existsSync(workProductsDir)) {
    try {
      const entries = fs.readdirSync(workProductsDir)
        .filter(f => f.endsWith('.md') || f.endsWith('.json'))
        .sort()
      if (entries.length > 0) {
        const latest = entries[entries.length - 1]
        const filePath = path.join(workProductsDir, latest)
        const stat = fs.statSync(filePath)
        return {
          file: latest,
          path: filePath,
          modified: stat.mtime.toISOString(),
          type: 'work-product'
        }
      }
    } catch {}
  }

  return null
}

const VALID_ACTIONS = ['menu', 'route', 'status', 'resume', 'list'] as const
const VALID_HUBS = ['init-project', 'ideation', 'orchestrate', 'harvest-context', 'project'] as const
type ActionName = typeof VALID_ACTIONS[number]
type HubName = typeof VALID_HUBS[number]

export default tool({
  description: "Hub menu router — parse subcommands, check state, and provide routing for hub commands (/init-project, /ideation, /orchestrate, /harvest-context, /project). Use 'route' to get delegation info for a subcommand. Use 'status' or 'resume' for state queries. Do NOT use 'menu' action — list subcommands as plain text instead (saves an LLM request).",
  args: {
    action: tool.schema.string().describe(
      `Action: 'menu' returns interactive menu JSON, 'route' parses args and returns routing, 'status' shows hub state, 'resume' gets latest checkpoint, 'list' lists all hubs. Valid: ${VALID_ACTIONS.join(', ')}`
    ),
    hub: tool.schema.string().optional().describe(`Hub command name. Valid: ${VALID_HUBS.join(', ')}`),
    subcommand: tool.schema.string().optional().describe("Subcommand to route to (for 'route' action)"),
    flags: tool.schema.string().optional().describe("Flags string to parse (e.g., '--full --force')")
  },
  async execute(args, context) {
    if (!VALID_ACTIONS.includes(args.action as ActionName)) {
      return { error: `Invalid action '${args.action}'. Valid: ${VALID_ACTIONS.join(', ')}` }
    }
    if (args.hub && !VALID_HUBS.includes(args.hub as HubName)) {
      return { error: `Invalid hub '${args.hub}'. Valid: ${VALID_HUBS.join(', ')}` }
    }
    switch (args.action) {
      case 'list': {
        return JSON.stringify({
          hubs: HUBS.map(h => ({
            name: h.name,
            description: h.description,
            subcommandCount: h.subcommands.length,
            subcommands: h.subcommands.map(s => s.label),
            hasState: !!h.stateDir
          }))
        })
      }

      case 'menu': {
        if (!args.hub) return JSON.stringify({ error: "Hub name required for menu action. Available: init-project, ideation, orchestrate, harvest-context, project" })
        const hub = HUBS.find(h => h.name === args.hub)
        if (!hub) return JSON.stringify({ error: `Unknown hub: ${args.hub}` })

        const stateInfo = getStateInfo(hub)
        
        const menuOptions = hub.subcommands.map(s => ({
          label: s.label,
          description: s.description
        }))

        return JSON.stringify({
          hub: hub.name,
          description: hub.description,
          options: menuOptions,
          state: stateInfo
        })
      }

      case 'route': {
        if (!args.hub) return JSON.stringify({ error: "Hub name required for route action" })
        if (!args.subcommand) return JSON.stringify({ error: "Subcommand required for route action" })
        const hub = HUBS.find(h => h.name === args.hub)
        if (!hub) return JSON.stringify({ error: `Unknown hub: ${args.hub}` })

        const sub = hub.subcommands.find(s => s.label === args.subcommand)
        if (!sub) {
          const available = hub.subcommands.map(s => s.label)
          return JSON.stringify({ error: `Unknown subcommand '${args.subcommand}' for ${hub.name}`, available })
        }

        // Check cache first
        const cacheKey = `${args.hub}:${args.subcommand}`
        const cached = _routeCache.get(cacheKey)
        if (cached) return cached

        const stateInfo = getStateInfo(hub)
        const checkpoint = getLatestCheckpoint(hub)

        const result = JSON.stringify({
          hub: hub.name,
          subcommand: sub.label,
          description: sub.description,
          reminder: sub.reminder,
          phases: sub.phases || null,
          delegation: {
            type: sub.skill ? 'skill' : sub.agent ? 'agent' : sub.command ? 'command' : 'inline',
            target: sub.skill || sub.agent || sub.command || 'inline'
          },
          flags: args.flags || null,
          state: stateInfo,
          checkpoint: checkpoint,
          canResume: !!checkpoint
        })
        _routeCache.set(cacheKey, result)
        return result
      }

      case 'status': {
        if (!args.hub) return JSON.stringify({ error: "Hub name required for status action" })
        const hub = HUBS.find(h => h.name === args.hub)
        if (!hub) return JSON.stringify({ error: `Unknown hub: ${args.hub}` })

        const stateInfo = getStateInfo(hub)
        const checkpoint = getLatestCheckpoint(hub)

        return JSON.stringify({
          hub: hub.name,
          state: stateInfo,
          checkpoint: checkpoint,
          subcommands: hub.subcommands.map(s => ({
            label: s.label,
            delegationType: s.skill ? 'skill' : s.agent ? 'agent' : s.command ? 'command' : 'inline',
            target: s.skill || s.agent || s.command || 'inline'
          }))
        })
      }

      case 'resume': {
        if (!args.hub) return JSON.stringify({ error: "Hub name required for resume action" })
        const hub = HUBS.find(h => h.name === args.hub)
        if (!hub) return JSON.stringify({ error: `Unknown hub: ${args.hub}` })
        
        if (!hub.stateDir) return JSON.stringify({ error: `${hub.name} is stateless — no resume available` })

        const checkpoint = getLatestCheckpoint(hub)
        if (!checkpoint) {
          const stateInfo = getStateInfo(hub)
          return JSON.stringify({
            resumable: false,
            hub: hub.name,
            statePath: getStateDir(hub),
            message: `No checkpoint found for ${hub.name}. Start a new session with a subcommand.`,
            stateFiles: stateInfo
          })
        }

        return JSON.stringify({
          resumable: true,
          hub: hub.name,
          checkpoint: checkpoint,
          statePath: getStateDir(hub),
          message: `Resuming ${hub.name} from checkpoint: ${checkpoint.file}`
        })
      }

      default:
        return JSON.stringify({ error: `Unknown action: ${args.action}. Available: menu, route, status, resume, list` })
    }
  }
})