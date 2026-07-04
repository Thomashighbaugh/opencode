/** @jsxImportSource @opentui/solid */
import type { TuiPlugin, TuiPluginApi, TuiPluginMeta, TuiDialogSelectOption } from '@opencode-ai/plugin/tui'

interface Sub { label: string; description: string }
interface Hub { name: string; title: string; description: string; subs: Sub[] }

const HUBS: Hub[] = [
  { name: "init-project", title: "Init Project", description: "Initialize or refine project setup", subs: [
    { label: "setup", description: "Full project setup — global Hubs verify, detection, scaffold, provision agents/tools, docs, context, routing, verify" },
    { label: "detect", description: "Detect language, framework, build tools, and key directories" },
    { label: "recommend", description: "Recommend global resources for detected stack — maps stack fingerprint to relevant skills, agents, rules, and archetype via stack-recommender skill" },
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
    { label: "plan", description: "Interview-style strategic planning — clarify goals, break into tasks" },
    { label: "brainstorm", description: "Free-form idea generation — diverge then converge" },
    { label: "decomposition", description: "Break complex work into ordered, verifiable subtasks" },
    { label: "refine", description: "Diverge/converge iteration — expand ideas, then sharpen them" },
    { label: "overhaul", description: "8-dimension project audit — produce prioritized improvement plan" },
    { label: "deep", description: "Socratic interview with ambiguity gating — crystallize vague requirements" },
    { label: "graph", description: "Visual relationship mapping — dependencies, components, tradeoffs" },
    { label: "research", description: "Multi-model synthesis — diverse perspectives merged into one answer" },
    { label: "ralplan", description: "Consensus planning gate — validate plan is concrete enough to execute" },
    { label: "ddd", description: "Domain-driven design — model bounded contexts, aggregates, domain events" },
    { label: "event-storming", description: "Collaborative domain exploration via timeline, commands, events, policies" },
    { label: "double-diamond", description: "Design Council framework — discover, define, develop, deliver" },
    { label: "jtbd", description: "Jobs-to-be-done — frame requirements around customer functional jobs" },
    { label: "impact-mapping", description: "Goal mapping — trace deliverables to business impact" },
    { label: "spiral", description: "Risk-driven iterative planning — each cycle targets highest-risk items first" },
    { label: "spark", description: "Project-aware idea sparks — improvements & expansions in short prompts" },
    { label: "top-down", description: "Decompose from high-level vision into components and sub-systems" },
    { label: "bottom-up", description: "Build up from existing primitives into composed systems" },
    { label: "adversarial-debate", description: "Spec validation via oppositional debate — proposer vs critics" },
    { label: "cleanroom", description: "Formal correctness — box structure decomposition and statistical testing" },
    { label: "pwf", description: "Filesystem-as-disk planning — quality-gated convergence with recovery" },
    { label: "rpikit", description: "Research-Plan-Implement — stakes-based rigor scaling" },
    { label: "hive", description: "Agent swarm planning — interview, discover, produce plan.md with approval gate" },
    { label: "story-mapping", description: "User story mapping — journey spine with release prioritization" },
    { label: "lean-canvas", description: "Lean business model — problem, solution, metrics, competitive advantage" },
    { label: "constitution", description: "Project governance — code, UX, performance, security principles" },
    { label: "quality", description: "Code quality audit — complexity, duplication, naming, error handling" },
    { label: "modularity", description: "Module boundary analysis — detect circular dependencies, suggest reorg" },
    { label: "arch-prep", description: "Architecture prep for upcoming features — extension points, refactoring runway" },
    { label: "architecture", description: "Architectural friction analysis — propose deep-module refactors" },
    { label: "grill", description: "Stress-test a plan with relentless one-at-a-time questioning" },
    { label: "redesign", description: "Audit and upgrade existing UI to premium design standards" },
    { label: "web-research", description: "Multi-source web research — parallel searches, synthesize findings" },
    { label: "tech-eval", description: "Technology evaluation — structured pros/cons comparison against alternatives" },
    { label: "competitive-analysis", description: "Competitive landscape — feature comparison matrix" },
    { label: "tree-of-thoughts", description: "⚠️ EXPENSIVE: Explore parallel solution branches for open-ended problems" },
    { label: "opro", description: "⚠️ EXPENSIVE: Optimize prompts by testing variations against benchmarks" },
    { label: "analyze-patterns", description: "Analyze code patterns and anti-patterns — consistencies, convention violations" },
    { label: "resume", description: "Resume last ideation session" },
    { label: "status", description: "Show current ideation state" },
  ]},
  { name: "orchestrate", title: "Orchestrate", description: "Execution hub — pick pattern, load plan, build", subs: [
    { label: "ralph", description: "Persistent loop — keeps working until task is verified complete" },
    { label: "team", description: "N coordinated agents on shared task list — parallel, divide, split work" },
    { label: "deep", description: "2-stage: causal trace → deep interview → requirements crystallization" },
    { label: "ccg", description: "Multi-model synthesis — query diverse models, merge perspectives" },
    { label: "ultrawork", description: "Maximum parallel execution — high throughput, bulk tasks" },
    { label: "autopilot", description: "Full autonomy — idea to working code with minimal guidance" },
    { label: "sciomc", description: "Parallel scientist agents — comprehensive multi-angle analysis" },
    { label: "swarm", description: "Architect-led 11-agent team with gated QA pipeline" },
    { label: "state-machine", description: "State-machine orchestration — agents as states with transitions" },
    { label: "subagent-driven", description: "Per-task subagent with review gates — spec compliance after each task" },
    { label: "consensus", description: "Multi-agent voting — majority, weighted, or synthesis resolution" },
    { label: "evolutionary", description: "Evolutionary delivery — incremental builds with fitness validation" },
    { label: "spec-driven", description: "Spec-first development — formalize, validate, then implement" },
    { label: "react", description: "ReAct pattern — think → act → observe → repeat until goal met" },
    { label: "plan-execute", description: "Architect plans → executor builds step by step with verification" },
    { label: "hive", description: "Agent swarm execution — batched parallelism with worktree isolation" },
    { label: "tdd", description: "Test-driven development — red-green-refactor loop" },
    { label: "pair", description: "Pair programming — Driver writes, Navigator reviews in real-time" },
    { label: "pipeline", description: "Multi-stage pipeline — lint → test → build → deploy" },
    { label: "gsd", description: "Discuss→Plan→Execute→Verify→Ship pipeline with wave-based execution" },
    { label: "self-assess", description: "Iterative self-evaluation — execute, reflect, refine until targets met" },
    { label: "remediate", description: "CI/build failure auto-remediation — fix and re-run until green" },
    { label: "devin", description: "Autonomous Plan→Code→Debug→Deploy pipeline" },
    { label: "maestro", description: "Strict role separation — PM, Architect, Coder, never self-review" },
    { label: "metaswarm", description: "Autonomous issue-to-PR — 12 agents, 7 phases, adversarial reviews" },
    { label: "cc10x", description: "Intent-detecting router → BUILD/DEBUG/REVIEW/PLAN workflows" },
    { label: "gastown", description: "Git-backed work units with reliable outcomes from unreliable processes" },
    { label: "ruflo", description: "60+ agent swarm with Q-Learning routing and consensus protocols" },
    { label: "harden", description: "Composable robustness — safeTask, circuitBreaker, verificationGate" },
    { label: "brownfield", description: "Feature addition to existing codebase — analyze integration points first" },
    { label: "vibe-code", description: "Conversational rapid prototyping — describe, iterate, refine" },
    { label: "resume", description: "Resume last orchestration session" },
    { label: "status", description: "Show orchestration state" },
  ]},
  { name: "harvest-context", title: "Harvest Context", description: "Context and artifact hub — extract, generate, manage project context", subs: [
    { label: "session", description: "Extract session patterns and decisions — promote to durable project memory" },
    { label: "codebase", description: "Generate hierarchical AGENTS.md documentation across the codebase" },
    { label: "skill", description: "Create a reusable skill from session knowledge" },
    { label: "agent", description: "Create a specialized OpenCode agent with proper configuration" },
    { label: "command", description: "Create a project slash command with structured arguments" },
    { label: "memory", description: "Review reusable knowledge — decide what belongs in project memory" },
    { label: "docs", description: "Fetch official library docs via Context7 MCP API" },
    { label: "compare", description: "Compare alternatives via web research — structured comparison table" },
    { label: "decompose", description: "Break down a concept or goal into smaller actionable units" },
    { label: "context", description: "Manage context files — harvest, extract, organize, compact, map" },
    { label: "consume", description: "Ingest file/directory/URL and save as durable context" },
    { label: "compress", description: "Token compression strategies — density filtering, output compression" },
    { label: "secondbrain", description: "Privacy-first local knowledge base — markdown+Git with role packs" },
    { label: "journal", description: "Event-sourced journal for orchestration — replay, time-travel debugging" },
    { label: "search", description: "Semantic search across all context files — find decisions and patterns" },
    { label: "prune", description: "Stale context management — archive or delete old context files" },
    { label: "export", description: "Export context as readable summary, markdown bundle, or team report" },
    { label: "diff", description: "Context diff — compare current state to previous checkpoint" },
    { label: "rule", description: "Create a project rule — code conventions, architecture patterns, security" },
    { label: "sweep", description: "Scan .opencode/ for files that should be gitignored but aren't" },
    { label: "web-research", description: "Multi-source web research — parallel searches, synthesize findings" },
  ]},
  { name: "project", title: "Project Ops", description: "Project operations — tests, git, refactoring, optimization, changelogs, file organization", subs: [
    { label: "create-tests", description: "Generate comprehensive test suite" },
    { label: "commit", description: "Create well-formatted conventional commit" },
    { label: "git-stage-thread", description: "Stage git changes from current conversation thread" },
    { label: "pr", description: "Create, view, merge, or manage pull requests via GitHub CLI" },
    { label: "gh", description: "Full GitHub CLI operations — issues, PRs, code search, releases" },
    { label: "changelog", description: "Generate user-facing changelog from git commits" },
    { label: "optimize", description: "Analyze and optimize code for performance/security" },
    { label: "refactor", description: "Restructure code without changing behavior — extract, split, reduce coupling" },
    { label: "simplify", description: "Reduce code complexity — flatten nesting, simplify conditionals, clarify naming" },
    { label: "cleanup", description: "Regression-safe cleanup of AI-generated slop — dead code, redundant comments" },
    { label: "modernize", description: "Update code patterns to modern conventions — targeted, behavior-preserving" },
    { label: "icon", description: "Generate web/PWA/UE icon assets from source image" },
    { label: "organize", description: "Find duplicates, suggest structures, automate file cleanup" },
    { label: "converge", description: "5-gate quality convergence — functional, lint, type, security, performance" },
    { label: "scan", description: "Security vulnerability scan — SAST, secrets detection, dependency audit" },
    { label: "sandbox", description: "Sandbox enforcement — policy-based tool control, file protection" },
    { label: "retrospect", description: "Post-run retrospective — lessons learned, error taxonomy, metrics" },
    { label: "purge", description: "Clean up stale orchestration state — remove old runs, free disk space" },
    { label: "release", description: "Tag and release — bump version, generate changelog, create GitHub release" },
    { label: "review", description: "Full code review — analyze changes, security scan, complexity check" },
    { label: "audit", description: "Project health check — dependencies, security, code quality, test coverage" },
    { label: "archive", description: "Move stale branches, artifacts, unused config to timestamped archive" },
    { label: "workspace", description: "Manage .opencode across projects — list, sync config, check health" },
    { label: "git-cleanup", description: "Fix orphaned CHANGELOG entries after .git/ rebuild" },
    { label: "readme", description: "Update README to reflect current codebase state" },
  ]},
  { name: "skills", title: "Skills", description: "Skill management — create, edit, list, search, package, sync, validate skills", subs: [
    { label: "list", description: "List all available skills organized by scope" },
    { label: "add", description: "Interactive wizard for quick skill creation" },
    { label: "create", description: "Full skill creation workflow with bundled resources" },
    { label: "remove", description: "Remove a skill by name — searches both scopes, confirms before deleting" },
    { label: "edit", description: "Edit an existing skill interactively — find, display, modify, write back" },
    { label: "search", description: "Search skills by content, triggers, name, or description" },
    { label: "info", description: "Show detailed information about a skill — full content and metadata" },
    { label: "update", description: "Update an existing skill via skill-creator iteration workflow" },
    { label: "package", description: "Package a skill for distribution — validate, create distributable zip" },
    { label: "validate", description: "Validate a skill's structure — run checks, report errors, suggest fixes" },
    { label: "sync", description: "Sync skills between user and project scopes" },
    { label: "setup", description: "Interactive setup wizard — create directories, scan inventory, offer actions" },
    { label: "scan", description: "Quick scan of skill directories — non-interactive inventory" },
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