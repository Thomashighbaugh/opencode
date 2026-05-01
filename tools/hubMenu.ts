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
      { label: "setup", description: "Full project setup — global JOC verify, detection, scaffold, docs, context, routing, verify", skill: "init-project", reminder: "Full init from scratch. I'll verify global JOC, detect your stack, scaffold config, generate docs, and validate.", phases: "0-7" },
      { label: "detect", description: "Detect language, framework, build tools, and key directories", agent: "explore", reminder: "Detecting your project stack. I'll identify language, framework, package manager, build system, and CI.", phases: "0-1" },
      { label: "docs", description: "Generate hierarchical AGENTS.md documentation across the codebase", skill: "deepinit", reminder: "Generating codebase documentation. I'll create hierarchical AGENTS.md files across your directories.", phases: "4" },
      { label: "context", description: "Capture session knowledge, promote insights to project memory and docs", skill: "remember", reminder: "Capturing session knowledge. I'll promote insights to project memory, notepad, and AGENTS.md.", phases: "5" },
      { label: "verify", description: "Validate configuration completeness, file existence, and reference integrity", agent: "verifier", reminder: "Validating configuration. I'll check file existence, config syntax, parent refs, and gitignore.", phases: "7" },
      { label: "refresh", description: "Update existing configuration — preserve manual edits, merge new detections", skill: "init-project", reminder: "Updating existing config. I'll preserve your manual edits and merge new detections.", phases: "0-7 (merge)" },
      { label: "status", description: "Show current initialization state and checkpoint progress", inline: true, reminder: "Showing init state and checkpoint progress." },
      { label: "map-codebase", description: "Analyze existing brownfield codebase — spawn parallel agents to map stack, architecture, conventions, and integration points before init", inline: true, reminder: "Mapping codebase. I'll spawn parallel agents to analyze your stack, architecture, patterns, conventions, and concerns — then feed that into project initialization." },
      { label: "doctor", description: "Run diagnostic health check — validate JOC installation, config integrity, state consistency, and hook status", inline: true, reminder: "Running diagnostics. I'll check JOC installation health, config integrity, state consistency, and hook/plugin status." }
    ]
  },
  {
    name: "ideation",
    description: "Planning, research, and ideation hub",
    stateDir: "ideation",
    subcommands: [
      { label: "plan", description: "Interview-style strategic planning — clarify goals, break into tasks", skill: "plan", reminder: "Interview-style strategic planning. I'll ask clarifying questions, identify constraints, and break your goal into ordered tasks with acceptance criteria." },
      { label: "refine", description: "Diverge/converge iteration — expand ideas, then sharpen them", skill: "idea-refine", reminder: "Diverge/converge iteration. I'll expand your idea through structured brainstorming, then help you converge on the strongest version." },
      { label: "deep", description: "Socratic interview with ambiguity gating — crystallize vague requirements", skill: "deep-interview", reminder: "Socratic interview with ambiguity gating. I'll ask probing questions until your requirements are fully crystallized." },
      { label: "graph", description: "Visual relationship mapping — dependencies, components, tradeoffs", skill: "graph-thinking", reminder: "Visual relationship mapping. I'll map dependencies, components, and tradeoffs as a graph to reveal structure you might miss linearly." },
      { label: "research", description: "Multi-model synthesis — diverse perspectives merged into one answer", skill: "ccg", reminder: "Multi-model synthesis. I'll gather diverse perspectives on your question and merge them into a coherent, cross-referenced answer." },
      { label: "ralplan", description: "Consensus planning gate — validate plan is concrete enough to execute", skill: "ralplan", reminder: "Consensus planning gate. I'll validate that your plan is concrete enough to execute, and if not, run an interview to sharpen it first." },
      { label: "ddd", description: "Domain-driven design — model bounded contexts, aggregates, domain events", inline: true, reminder: "Domain-driven design. I'll explore your business domain, identify bounded contexts, model aggregates and entities, and define domain events and ubiquitous language." },
      { label: "event-storming", description: "Collaborative domain exploration via timeline, commands, events, policies", inline: true, reminder: "Event storming. I'll model your system as a timeline of domain events, identify commands that trigger them, aggregates that process them, and policies that react." },
      { label: "double-diamond", description: "Design Council framework — discover, define, develop, deliver", inline: true, reminder: "Double diamond. I'll guide through divergent discovery and definition (the problem space), then convergent development and delivery (the solution space)." },
      { label: "jtbd", description: "Jobs-to-be-done — frame requirements around customer functional jobs", inline: true, reminder: "Jobs-to-be-done. I'll reframe your requirements around what customers are trying to accomplish (functional jobs) rather than features or solutions." },
      { label: "impact-mapping", description: "Why-who-how-what goal mapping — trace deliverables to business impact", inline: true, reminder: "Impact mapping. I'll map your goals through actors and impacts to deliverables, ensuring every output traces back to measurable business outcomes." },
      { label: "spiral", description: "Risk-driven iterative planning — each cycle targets highest-risk items first", inline: true, reminder: "Spiral model. I'll plan iterative cycles that tackle highest-risk items first — technical uncertainty, requirement ambiguity, or integration risks — with each cycle producing a validated increment." },
      { label: "top-down", description: "Decompose from high-level vision into components and sub-systems", inline: true, reminder: "Top-down design. I'll start from your high-level vision and systematically decompose into components, sub-systems, and modules with clear interfaces." },
      { label: "bottom-up", description: "Build up from existing primitives and capabilities into composed systems", inline: true, reminder: "Bottom-up design. I'll survey existing primitives, capabilities, and components, then compose them upward into higher-level systems and workflows." },
      { label: "adversarial-debate", description: "Spec validation via oppositional debate — proposer vs security/performance critics with judge convergence", inline: true, reminder: "Adversarial spec debate. I'll propose a specification, then run critic agents (security, performance, UX) to challenge it with flaws and risks. I'll refine against each critique and iterate until the spec is robust and well-defended." },
      { label: "cleanroom", description: "Formal correctness with box structures — black box → state box → clear box, statistical usage testing, MTTF certification", inline: true, reminder: "Cleanroom methodology. I'll use formal box structure specifications (black box → state box → clear box), mathematical correctness verification instead of developer unit testing, statistical usage testing from operational profiles, and MTTF reliability certification." },
      { label: "pwf", description: "Planning-with-files — treat filesystem as disk, context window as RAM; three-file pattern with quality-gated convergence and session recovery", inline: true, reminder: "Planning-with-files. I'll create task_plan.md, findings.md, and progress.md — treating filesystem as persistent disk and context window as volatile RAM. I'll use quality-gated convergence scoring and never repeat failures across sessions." },
      { label: "rpikit", description: "Research-Plan-Implement with stakes-based rigor scaling and 'Iron Law' — don't touch code until problem is understood", inline: true, reminder: "Research-Plan-Implement. I'll follow the Iron Law: first understand the problem domain, then research approaches, then plan with stakes-based rigor (low/medium/high risk), then implement with mandatory test-first and verification-before-completion." },
      { label: "constitution", description: "Establish project governance — code quality, UX, performance, and security principles as input to spec-driven work", inline: true, reminder: "Constitution. I'll establish governing principles for your project: code quality standards, UX expectations, performance targets, and security requirements. This constitution feeds into all subsequent spec-driven planning." },
      { label: "resume", description: "Resume last ideation session", inline: true, reminder: "Resuming last ideation session." },
      { label: "status", description: "Show current ideation state", inline: true, reminder: "Showing ideation state." }
    ]
  },
  {
    name: "orchestrate",
    description: "Execution hub — pick an orchestration pattern, load a plan, and build",
    stateDir: "orchestration",
    subcommands: [
      { label: "ralph", description: "Persistent loop — keeps working until task is verified complete", skill: "ralph", reminder: "Persistent loop. I'll keep working until the task is verified complete. Won't stop early." },
      { label: "team", description: "N coordinated agents with shared task list and real-time messaging", skill: "team", reminder: "Coordinated agents. I'll spin up N agents on a shared task list with real-time messaging." },
      { label: "deep", description: "2-stage: causal trace → deep interview to crystallize requirements", skill: "deep-dive", reminder: "2-stage pipeline. First I'll trace the root cause, then interview to crystallize requirements." },
      { label: "ccg", description: "Multi-model synthesis — query diverse models, merge perspectives", skill: "ccg", reminder: "Multi-model synthesis. I'll query diverse models and merge their perspectives into one answer." },
      { label: "ultrawork", description: "Maximum parallel execution for high-throughput tasks", skill: "ultrawork", reminder: "Maximum parallelism. I'll execute all independent tasks simultaneously." },
      { label: "autopilot", description: "Full autonomous execution from idea to working code", skill: "autopilot", reminder: "Full autonomy. From idea to working code — I'll handle everything." },
      { label: "sciomc", description: "Parallel scientist agents for comprehensive analysis", skill: "sciomc", reminder: "Parallel scientists. I'll run multiple analysis agents concurrently for comprehensive coverage." },
      { label: "swarm", description: "Architect-led team of 11 specialized agents with gated QA pipeline", skill: "opencode-swarm", reminder: "Swarm. Architect-led team with coder, reviewer, test engineer, critic, and more — gated pipeline ensures quality at every step." },
      { label: "state-machine", description: "State-machine orchestration — agents as states with explicit transitions and guards", inline: true, reminder: "State-machine orchestration. I'll model your workflow as states with explicit transitions, guard conditions, and entry/exit actions. Each agent is a state node." },
      { label: "consensus", description: "Multi-agent consensus/voting — run agents independently, resolve via majority, weighting, or synthesis", inline: true, reminder: "Consensus and voting. I'll run multiple agents independently on the same task, then aggregate results via majority vote, weighted scoring, or LLM synthesis." },
      { label: "evolutionary", description: "Evolutionary delivery — incremental builds with fitness validation at each generation", inline: true, reminder: "Evolutionary delivery. I'll incrementally build and refine through generations, validating fitness (tests, quality gates) at each step and selecting the strongest candidates forward." },
      { label: "spec-driven", description: "Spec-first development — formalize spec, validate it, then implement against it", inline: true, reminder: "Spec-driven development. I'll write a formal spec first, validate it through adversarial review, then implement strictly against it with traceability from spec to code." },
      { label: "plan-execute", description: "Classic plan-then-execute — architect builds complete plan, executor implements step by step", inline: true, reminder: "Plan-and-execute. I'll build a complete implementation plan first, then execute it step by step, verifying each step before moving to the next." },
      { label: "gsd", description: "Get Shit Done pipeline — discuss → plan → execute → verify → ship with wave-based parallel execution, fresh context per task, and atomic commits", inline: true, reminder: "Get Shit Done pipeline. I'll run the discuss→plan→execute→verify→ship cycle: (1) capture your decisions, (2) research and create verified atomic plans, (3) execute in parallel waves with fresh context per task, (4) walk through UAT verification, (5) create PR for shipping. Each task gets atomic commits and built-in quality gates." },
      { label: "self-assess", description: "Iterative self-evaluation — agent executes, critically evaluates against quality thresholds, reflects and refines until targets met", inline: true, reminder: "Self-assessment loop. I'll execute each task, then critically self-evaluate my work against defined quality criteria. If below threshold, I'll reflect on weaknesses and iteratively refine until quality targets are met or max iterations reached." },
      { label: "remediate", description: "CI/build failure auto-remediation — monitor failures, analyze root causes, auto-apply fixes, re-run until green", inline: true, reminder: "Build remediation. I'll monitor build/test runs, detect failures in real-time, analyze root causes, auto-apply fixes, and re-run until the build passes or max attempts reached. Human review breakpoints for risky fixes." },
      { label: "devin", description: "Autonomous Plan→Code→Debug→Deploy pipeline with iterative debugging cycles and root-cause analysis loops", inline: true, reminder: "Devin pipeline. I'll plan the feature, write code, run tests, debug failures with root cause analysis, apply fixes, re-test, quality-score, and deploy — all with appropriate approval gates between phases." },
      { label: "maestro", description: "Strict role separation — PMs gather requirements, Architects design/review (never code), Coders implement/test (never self-review)", inline: true, reminder: "Maestro factory. I'll enforce strict role separation: PMs gather requirements, Architects design and review (never write code), Coders implement and test (never self-review). Knowledge graph for institutional memory across sessions." },
      { label: "metaswarm", description: "Autonomous issue-to-PR with 12 agents, 7 phases, adversarial reviews with fresh reviewers to block anchoring bias", inline: true, reminder: "Metaswarm. I'll orchestrate 12 agents across 7 phases: adversarial reviews with fresh reviewers to prevent anchoring bias, blocking quality gates (never advisory), mandatory TDD with 100% coverage targets, and independent validation that never trusts subagent self-reports." },
      { label: "cc10x", description: "Intent-detecting router → dispatches to BUILD/DEBUG/REVIEW/PLAN workflows with evidence-first validation and confidence gating", inline: true, reminder: "CC10X routing. I'll detect your intent and route to the right pipeline: BUILD (spec→implement→verify→ship), DEBUG (reproduce→trace→diagnose→fix), REVIEW (multi-agent parallel review with confidence scoring), or PLAN (research→draft→validate)." },
      { label: "gastown", description: "GUPP principle — 'if work on your hook, YOU MUST RUN IT' with git-backed work units and NDI for reliable outcomes from unreliable processes", inline: true, reminder: "Gastown. I'll use git-backed work units with the GUPP principle (if work is on your hook, you must run it), MEOW decomposition, and Nondeterministic Idempotence (NDI) to achieve reliable outcomes from unreliable multi-agent processes." },
      { label: "ruflo", description: "60+ agent swarm with Q-Learning smart routing, 4 consensus protocols, and Queen/Worker hierarchical topologies", inline: true, reminder: "Ruflo swarm. I'll orchestrate a swarm with Q-Learning smart routing (routes to Booster/Medium/Complex agents), Queen/Worker hierarchical topologies, and consensus via Raft/Byzantine/Gossip/CRDT protocols for coordination." },
      { label: "harden", description: "Composable robustness — safeTask (error+deviation tracking), circuitBreaker (halt on failure rate), verificationGate (block downstream until verified)", inline: true, reminder: "Process hardening. I'll wrap your workflow with safeTask (error recovery with deviation tracking), circuitBreaker (halt runaway loops when failure rate exceeds threshold), and verificationGate (block downstream phases until verification passes)." },
      { label: "brownfield", description: "Feature addition to existing codebase — analyze system, identify integration points, validate strategy before implementation", inline: true, reminder: "Brownfield development. I'll analyze the existing codebase, identify integration points, plan the feature addition with risk validation for consistency, then implement with cross-system compatibility checks." },
      { label: "vibe-code", description: "Conversational rapid prototyping — describe app in natural language, generate full-stack, iterate with feedback through conversational rounds", inline: true, reminder: "Conversational development. Describe what you want in natural language. I'll generate a full-stack prototype, you give feedback, and I'll refine iteratively through conversational rounds." },
      { label: "resume", description: "Resume last orchestration session", inline: true, reminder: "Resuming last orchestration session." },
      { label: "status", description: "Show current orchestration state", inline: true, reminder: "Showing orchestration state." }
    ]
  },
  {
    name: "harvest-context",
    description: "Context and artifact hub — extract, generate, and manage project context",
    stateDir: "harvest",
    subcommands: [
      { label: "session", description: "Extract decisions, patterns, learnings from current session", inline: true, reminder: "Extracting session knowledge. I'll identify decisions, patterns, and learnings from this session." },
      { label: "codebase", description: "Generate hierarchical AGENTS.md across the codebase", skill: "deepinit", reminder: "Generating codebase documentation. I'll create hierarchical AGENTS.md files across the codebase." },
      { label: "skill", description: "Create a reusable skill from session knowledge", skill: "skill-creator", reminder: "Creating a reusable skill. I'll extract the repeatable workflow from this session into a skill." },
      { label: "agent", description: "Create a project-specific agent", skill: "opencode-agent-creator", reminder: "Creating a project-specific agent. I'll define the agent's purpose, tools, and persona." },
      { label: "rule", description: "Create a project rule (.opencode/rules/)", inline: true, reminder: "Creating a project rule. I'll write a rule file for .opencode/rules/." },
      { label: "command", description: "Create a project slash command", skill: "opencode-command-creator", reminder: "Creating a project slash command. I'll define the command's trigger, arguments, and behavior." },
      { label: "memory", description: "Promote durable knowledge to project memory, notepad, or wiki", skill: "remember", reminder: "Promoting knowledge. I'll classify what belongs in project memory, notepad, or wiki." },
      { label: "docs", description: "Fetch official library documentation for any package", inline: true, reminder: "Fetching library docs. I'll use Context7 MCP to get up-to-date documentation." },
      { label: "decompose", description: "Break down a concept or goal into smaller actionable units", agent: "planner", reminder: "Decomposing into action units. I'll break down the concept into ordered, implementable tasks." },
      { label: "context", description: "Manage context files — harvest, extract, organize, compact, map", inline: true, reminder: "Managing context files. I'll harvest, extract, organize, or compact context." },
      { label: "compress", description: "Token compression strategies — density filtering (~29% savings), command output compression (~47%), library cache compression (~94%)", inline: true, reminder: "Compressing context. I'll apply 4-layer token compression: density-filter on user prompts, command-compressor on shell output, sentence-extractor on agent context, and library-cache compression. Real sessions see 50-67% token savings." },
      { label: "secondbrain", description: "Privacy-first local knowledge base — markdown+Git with role packs and self-healing cross-references", inline: true, reminder: "Second brain. I'll help set up a local-first knowledge management system with markdown+Git, 7-day evolution cycles (daily capture→weekly reflection→monthly synthesis), role packs for personalization, and self-healing cross-references." },
      { label: "journal", description: "Event-sourced journal for orchestration runs — deterministic replay, time-travel debugging, SHA-256 checksums", inline: true, reminder: "Journal system. I'll set up event-sourced journaling: append-only, one-file-per-event, SHA-256 checksums, deterministic replay for time-travel debugging, and git-friendly naming. All orchestration runs become verifiable and replayable." }
    ]
  },
  {
    name: "project",
    description: "Project operations hub — tests, git workflows, optimization, icons, changelogs, and file organization",
    stateDir: "",
    subcommands: [
      { label: "tests", description: "Generate comprehensive 8-type test suite", command: "create-tests", reminder: "Generating test suite. I'll create comprehensive tests across 8 test types." },
      { label: "commit", description: "Create well-formatted conventional commit", skill: "conventional-commit", reminder: "Creating conventional commit. I'll stage changes and write a well-formatted commit message." },
      { label: "stage", description: "Stage git changes from current conversation thread", command: "git-stage-thread", reminder: "Staging git changes. I'll identify and stage the files changed in this conversation." },
      { label: "pr", description: "Create, view, merge, or manage pull requests", command: "pr", reminder: "Managing pull requests. I'll create, view, or merge PRs via GitHub CLI." },
      { label: "gh", description: "Full GitHub CLI operations via gh", skill: "github-ops", reminder: "GitHub operations. I'll use gh CLI for PRs, issues, searches, and more." },
      { label: "optimize", description: "Analyze and optimize code for performance/security", command: "optimize", reminder: "Analyzing and optimizing. I'll find performance and security improvements." },
      { label: "icon", description: "Generate web/PWA/UE icon assets from source image", skill: "icon-generator", reminder: "Generating icon assets. I'll create favicon, PWA icons, and optional UE icons from your source." },
      { label: "organize", description: "Find duplicates, suggest structures, automate cleanup", skill: "file-organizer", reminder: "Organizing files. I'll find duplicates, suggest better structures, and automate cleanup." },
      { label: "analyze", description: "Analyze code patterns in the codebase", command: "analyze-patterns", reminder: "Analyzing code patterns. I'll find patterns, anti-patterns, and improvement opportunities." },
      { label: "changelog", description: "Generate user-facing changelog from git commits", skill: "changelog-generator", reminder: "Generating changelog. I'll analyze commits and create a user-facing release notes." },
      { label: "converge", description: "5-gate quality convergence — functional tests, lint/complexity, type safety, security scanning, performance thresholds with progressive target escalation", inline: true, reminder: "Quality convergence. I'll run 5 quality gates in parallel (functional tests, code quality, type safety, security scanning, performance thresholds) with progressive target escalation (70→80→85→90) and plateau detection. Stops when quality converges." },
      { label: "scan", description: "Security vulnerability scan — SAST rules, secrets detection, dependency audit, compliance checks", inline: true, reminder: "Security scan. I'll run SAST (63+ rules across 9 languages), secrets scanning, dependency audit, and compliance validation against your project. Post-install codebase scan for new projects." },
      { label: "sandbox", description: "Sandbox enforcement — policy-based tool control, file protection, network filtering for agent tool calls", inline: true, reminder: "Sandbox enforcement. I'll define policy-based controls for tool execution: which commands can run, which files are protected, and network access rules. Applies to all agent tool calls." },
      { label: "retrospect", description: "Post-run retrospective analysis — extract lessons learned, error taxonomy classification, metrics across all phases", inline: true, reminder: "Retrospective analysis. I'll analyze the completed orchestration run: extract lessons learned, classify errors by taxonomy, compute phase metrics, and write a retrospective for the next project session." },
      { label: "purge", description: "Clean up stale orchestration state — remove old runs, free disk space, preserve recent history", inline: true, reminder: "State cleanup. I'll identify and purge stale orchestration runs, free disk space, and preserve recent history based on configurable retention policies." }
    ]
  }
]

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

  if (!fs.existsSync(stateDir)) {
    return { hasState: false, path: stateDir }
  }

  const files: Array<{name: string; modified: string; size: number}> = []
  try {
    for (const entry of fs.readdirSync(stateDir, { recursive: true, withFileTypes: false })) {
      const filePath = path.join(stateDir, entry as string)
      try {
        const stat = fs.statSync(filePath)
        if (stat.isFile()) {
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

        const stateInfo = getStateInfo(hub)
        const checkpoint = getLatestCheckpoint(hub)

        return JSON.stringify({
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