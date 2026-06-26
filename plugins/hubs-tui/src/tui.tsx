/** @jsxImportSource @opentui/solid */
import type { TuiPlugin, TuiPluginApi, TuiPluginMeta, TuiDialogSelectOption } from '@opencode-ai/plugin/tui'

interface Sub { label: string; description: string }
interface Hub { name: string; title: string; description: string; subs: Sub[] }

const HUBS: Hub[] = [
  { name: "init-project", title: "Init Project", description: "Initialize or refine project setup", subs: [
    { label: "setup", description: "Full project setup — global Hubs verify, detection, scaffold, provision agents/tools, docs, context, routing, verify" },
    { label: "detect", description: "Detect language, framework, build tools, and key directories" },
    { label: "docs", description: "Generate hierarchical AGENTS.md documentation across the codebase" },
    { label: "context", description: "Capture session knowledge, promote insights to project memory and docs" },
    { label: "verify", description: "Validate configuration completeness, file existence, and reference integrity" },
    { label: "refresh", description: "Update existing configuration — preserve manual edits, merge new detections" },
    { label: "status", description: "Show current initialization state and checkpoint progress" },
    { label: "map-codebase", description: "Analyze existing brownfield codebase — spawn parallel agents to map stack, architecture, conventions, and integration points before init" },
    { label: "doctor", description: "Run diagnostic health check — validate Hubs installation, config integrity, state consistency, and hook status" },
    { label: "reset", description: "Reset project state — archive .opencode/state and .opencode/context, start fresh with clean slate" },
    { label: "provision", description: "Analyze codebase and auto-generate project-specific agents, skills, tools, and rules in .opencode/" },
    { label: "tag", description: "Audit and fix resource tags on global skills, agents, rules, and archetypes for resource_tags filtering" },
    { label: "find-skills", description: "Discover skills relevant to the current project by searching across skill registries (skills.sh, GitHub)" },
    { label: "find-agents", description: "Discover agents relevant to the current project by searching across agent registries and GitHub" },
    { label: "find-tools", description: "Discover TypeScript tools relevant to the current project by searching registries (GitHub, npm) and local template catalog" },
    { label: "find-rules", description: "Discover OpenCode rules relevant to the current project by searching registries (GitHub, skills.sh) and local template catalog" },
  ]},
  { name: "ideation", title: "Ideation", description: "Planning, research, and ideation hub", subs: [
    { label: "plan", description: "Interview-style strategic planning — identify constraints, ordered tasks, acceptance criteria" },
    { label: "brainstorm", description: "Free-form idea generation — throw ideas at the wall on any topic, then cluster and prioritize" },
    { label: "refine", description: "Diverge/converge iteration — expand ideas, then sharpen them" },
    { label: "overhaul", description: "Analyze project across 8 refinement dimensions — architecture, performance, security, code quality, testing, deps, DX — and produce a prioritized phased implementation plan" },
    { label: "deep", description: "Socratic interview with ambiguity gating — requirements crystallized before proceeding" },
    { label: "graph", description: "Visual relationship mapping — dependencies, components, tradeoffs" },
    { label: "research", description: "Multi-model research synthesis — gather diverse perspectives, merge coherent answer" },
    { label: "ralplan", description: "Consensus planning gate — validate plan is concrete enough to execute" },
    { label: "ddd", description: "Domain-driven design — model bounded contexts, aggregates, domain events" },
    { label: "event-storming", description: "Collaborative domain exploration via timeline, commands, events, policies" },
    { label: "double-diamond", description: "Design Council framework — discover, define, develop, deliver" },
    { label: "jtbd", description: "Jobs-to-be-done — frame requirements around customer functional jobs" },
    { label: "impact-mapping", description: "Why-who-how-what goal mapping — trace deliverables to business impact" },
    { label: "spiral", description: "Risk-driven iterative planning — each cycle targets highest-risk items first" },
    { label: "top-down", description: "Decompose from high-level vision into components and sub-systems" },
    { label: "bottom-up", description: "Build up from existing primitives and capabilities into composed systems" },
    { label: "adversarial-debate", description: "Spec validation via oppositional debate — proposer vs security/performance critics with judge convergence" },
    { label: "cleanroom", description: "Formal correctness with box structures — black box → state box → clear box, statistical usage testing, MTTF certification" },
    { label: "pwf", description: "Planning-with-files — treat filesystem as disk, context window as RAM; three-file pattern with quality-gated convergence and session recovery" },
    { label: "rpikit", description: "Research-Plan-Implement with stakes-based rigor scaling and 'Iron Law' — don't touch code until problem is understood" },
    { label: "hive", description: "Agent Hive planning — Architect Bee phase: interview, discover, context-gather, produce plan.md with approval gate before execution" },
    { label: "story-mapping", description: "User story mapping — arrange features along a user journey spine, prioritize by release for iterative delivery" },
    { label: "lean-canvas", description: "Lean business model canvas — one-page framework for problem, solution, key metrics, and competitive advantage" },
    { label: "constitution", description: "Establish project governance — code quality, UX, performance, and security principles as input to spec-driven work" },
    { label: "decomposition", description: "Decompose a task into actionable subtasks — break complex work into ordered, verifiable steps" },
    { label: "quality", description: "Deep-dive code quality audit — complexity hotspots, duplication clusters, naming violations, error handling gaps across the codebase" },
    { label: "modularity", description: "Module boundary analysis — coupling, cohesion, circular deps, god modules" },
    { label: "arch-prep", description: "Architecture runway for upcoming features — extension points, module plan, and refactoring runway before coding" },
    { label: "resume", description: "Resume last ideation session" },
    { label: "status", description: "Show ideation state" },
  ]},
  { name: "orchestrate", title: "Orchestrate", description: "Execution hub — pick pattern, load plan, build", subs: [
    { label: "ralph", description: "Persistent loop — keeps working until task is verified complete" },
    { label: "team", description: "N coordinated agents on shared task list — parallel, divide, split work" },
    { label: "deep", description: "2-stage: causal trace → deep interview → requirements crystallization" },
    { label: "ccg", description: "Multi-model synthesis — query diverse models for alternative perspectives" },
    { label: "ultrawork", description: "Maximum parallel execution — high throughput, bulk tasks" },
    { label: "autopilot", description: "Full autonomy — idea to working code with minimal guidance" },
    { label: "sciomc", description: "Parallel scientist agents — comprehensive analysis from multiple angles" },
    { label: "swarm", description: "Architect-led 11-agent team with gated QA pipeline — production quality" },
    { label: "state-machine", description: "State-machine orchestration — agents as states with explicit transitions and guards" },
    { label: "consensus", description: "Multi-agent voting — majority, weighted, or synthesis resolution" },
    { label: "evolutionary", description: "Evolutionary delivery — incremental builds with fitness validation at each generation" },
    { label: "spec-driven", description: "Spec-first development — formalize spec, validate it, then implement against it" },
    { label: "react", description: "ReAct pattern — interleaved Reasoning and Acting: think → act → observe → repeat until goal met" },
    { label: "plan-execute", description: "Architect plans → executor builds step by step with verification" },
    { label: "hive", description: "Agent Hive execution — Swarm Bee phase: batched parallelism with worktree isolation and blocker protocol" },
    { label: "tdd", description: "Test-driven development loop — red-green-refactor: write failing test, make it pass, refactor, repeat" },
    { label: "pair", description: "Pair programming — Driver writes code, Navigator reviews in real-time" },
    { label: "pipeline", description: "Declarative multi-stage pipeline — lint → test → build → deploy, each stage gates the next" },
    { label: "gsd", description: "Discuss→Plan→Execute→Verify→Ship pipeline with wave-based parallel execution and atomic commits" },
    { label: "self-assess", description: "Iterative self-evaluation — agent executes, critically evaluates, reflects and refines until targets met" },
    { label: "remediate", description: "CI/build failure auto-remediation — fix and re-run until green" },
    { label: "devin", description: "Autonomous Plan→Code→Debug→Deploy pipeline with iterative debugging and root-cause analysis loops" },
    { label: "maestro", description: "Strict role separation — PMs gather requirements, Architects design/review, Coders implement/test" },
    { label: "metaswarm", description: "Autonomous issue-to-PR with 12 agents, 7 phases, adversarial reviews to block anchoring bias" },
    { label: "cc10x", description: "Intent-detecting router → dispatches to BUILD/DEBUG/REVIEW/PLAN workflows with evidence-first validation" },
    { label: "gastown", description: "GUPP principle — git-backed work units with NDI for reliable outcomes from unreliable processes" },
    { label: "ruflo", description: "60+ agent swarm with Q-Learning smart routing, 4 consensus protocols, and Queen/Worker topologies" },
    { label: "harden", description: "safeTask + circuitBreaker + verificationGate — composable robustness" },
    { label: "brownfield", description: "Feature addition to existing codebase — analyze integration points first" },
    { label: "vibe-code", description: "Conversational rapid prototyping — describe, iterate, refine" },
    { label: "resume", description: "Resume last orchestration session" },
    { label: "status", description: "Show orchestration state" },
  ]},
  { name: "harvest-context", title: "Harvest Context", description: "Context and artifact hub — extract, generate, and manage project context", subs: [
    { label: "session", description: "Extract session patterns and decisions — promote to durable project memory" },
    { label: "codebase", description: "Generate hierarchical AGENTS.md documentation across the codebase" },
    { label: "skill", description: "Create a reusable skill from session knowledge — YAML frontmatter, workflow steps" },
    { label: "agent", description: "Create a specialized OpenCode agent with proper configuration" },
    { label: "command", description: "Create a project slash command with structured arguments" },
    { label: "memory", description: "Review reusable knowledge and decide what belongs in project memory" },
    { label: "docs", description: "Fetch official library docs via Context7 MCP API — React, Next.js, any npm/PyPI package" },
    { label: "decompose", description: "Break down a concept or goal into smaller actionable units" },
    { label: "context", description: "Manage context files — harvest, extract, organize, compact, map" },
    { label: "consume", description: "Ingest file/directory/URL — extract text and save as durable context in .opencode/context/research/" },
    { label: "compress", description: "Token compression strategies — density filtering, command output compression, library cache compression" },
    { label: "secondbrain", description: "Privacy-first local knowledge base — markdown+Git with role packs and self-healing cross-references" },
    { label: "journal", description: "Event-sourced journal for orchestration runs — deterministic replay, time-travel debugging, SHA-256 checksums" },
    { label: "search", description: "Semantic search across all context files — find decisions, patterns, research matching a query" },
    { label: "prune", description: "Stale context management — identify old or superseded context files, archive or delete them" },
    { label: "export", description: "Export context as readable summary, markdown bundle, or team report" },
    { label: "diff", description: "Context diff — compare current context state to previous checkpoint, showing new decisions and patterns" },
    { label: "rule", description: "Create a project rule (.opencode/rules/) — code conventions, architecture patterns, security policies" },
    { label: "sweep", description: "Scan .opencode/ for files that should be gitignored but aren't — prevents bloat that breaks git push" },
  ]},
  { name: "project", title: "Project Ops", description: "Project operations — tests, git, code refactoring, optimization, changelogs, and file organization", subs: [
    { label: "tests", description: "Generate comprehensive 8-type test suite" },
    { label: "commit", description: "Create well-formatted conventional commit" },
    { label: "stage", description: "Stage git changes from current conversation thread" },
    { label: "pr", description: "Create, view, merge, or manage pull requests via GitHub CLI" },
    { label: "gh", description: "Full GitHub CLI operations — issues, PRs, code search, releases" },
    { label: "changelog", description: "Generate user-facing changelog from git commits" },
    { label: "optimize", description: "Analyze and optimize code for performance/security" },
    { label: "refactor", description: "Restructure code without changing behavior — extract functions, split modules, reduce coupling" },
    { label: "simplify", description: "Reduce code complexity — flatten nesting, simplify conditionals, clarify naming" },
    { label: "cleanup", description: "Regression-safe cleanup of AI-generated slop — dead code, redundant comments, unused exports" },
    { label: "modernize", description: "Update code patterns to modern language/framework conventions — targeted, behavior-preserving modernization" },
    { label: "icon", description: "Generate web/PWA/UE icon assets from source image" },
    { label: "organize", description: "Find duplicates, suggest structures, automate cleanup" },
    { label: "analyze", description: "Analyze code patterns and anti-patterns across the codebase" },
    { label: "converge", description: "5-gate quality convergence — functional tests, lint/complexity, type safety, security, performance" },
    { label: "scan", description: "Security vulnerability scan — SAST rules, secrets detection, dependency audit, compliance checks" },
    { label: "sandbox", description: "Sandbox enforcement — policy-based tool control, file protection, network filtering" },
    { label: "retrospect", description: "Post-run retrospective analysis — lessons learned, error taxonomy, metrics across all phases" },
    { label: "purge", description: "Clean up stale orchestration state — remove old runs, free disk space" },
    { label: "release", description: "Tag and release — bump version, generate changelog, create GitHub release" },
    { label: "review", description: "Full code review round — analyze changes, run security scan, check complexity, produce report" },
    { label: "audit", description: "Comprehensive project health check — dependencies, security, code quality, test coverage, bundle size" },
    { label: "archive", description: "Move stale branches, old artifacts, unused config to timestamped archive" },
    { label: "workspace", description: "Manage .opencode across projects — list Hubs-enabled projects, sync config, check health" },
    { label: "git-cleanup", description: "Fix orphaned CHANGELOG entries referencing commits not in git history after .git/ rebuild — preserves entries, removes bad refs" },
  ]},
]

const tui: TuiPlugin = async (api: TuiPluginApi, _o: any, _m: TuiPluginMeta) => {
  api.command!.register(() =>
    HUBS.map(h => {
      const opts: TuiDialogSelectOption<string>[] = h.subs.map(s => ({ title: s.label, value: s.label, description: s.description }))
      return {
        title: h.title, value: h.name, description: h.description, category: "Hubs Hubs",
        slash: { name: h.name },
        onSelect: () => {
          const DS = api.ui.DialogSelect
          api.ui.dialog.setSize("large")
          api.ui.dialog.replace(() => DS({
            title: `${h.title} — Select Subcommand`, placeholder: "Choose...", options: opts,
            onSelect: (sel: TuiDialogSelectOption<string>) => {
              api.ui.dialog.clear()
              const s = h.subs.find(x => x.label === sel.value)
              if (!s) return
              const cmd = `/${h.name} ${s.label}`
              api.ui.toast({ title: cmd, message: cmd })
              api.client.tui.appendPrompt({ text: cmd + " " }).catch(() => {})
            }
          }))
        }
      }
    })
  )
}

const plugin = { id: "hubs-tui-hubs", tui }
export default plugin