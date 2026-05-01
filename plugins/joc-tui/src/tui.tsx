/** @jsxImportSource @opentui/solid */
import type { TuiPlugin, TuiPluginApi, PluginOptions, TuiPluginMeta, TuiDialogSelectOption } from '@opencode-ai/plugin/tui'

interface HubSubcommand {
  label: string
  description: string
  /** Slash command for routing, e.g., "/ideation plan" */
  command: string
  /** Prompt text submitted to the LLM */
  promptText: string
}

interface HubDefinition {
  name: string
  title: string
  description: string
  subcommands: HubSubcommand[]
}

const HUBS: HubDefinition[] = [
  {
    name: "init-project",
    title: "Init Project",
    description: "Initialize or refine project setup",
    subcommands: [
      { label: "setup", description: "Full project setup", command: "/init-project setup", promptText: "Full init from scratch. Verify global JOC, detect stack, scaffold config, generate docs, validate — phases 0-7." },
      { label: "detect", description: "Detect language, framework, build tools", command: "/init-project detect", promptText: "Detect project stack — identify language, framework, package manager, build system, and CI." },
      { label: "docs", description: "Generate hierarchical AGENTS.md", command: "/init-project docs", promptText: "Generate codebase documentation — create hierarchical AGENTS.md files via deepinit." },
      { label: "context", description: "Capture session knowledge", command: "/init-project context", promptText: "Capture session knowledge — promote insights to project memory, notepad, and AGENTS.md." },
      { label: "verify", description: "Validate configuration", command: "/init-project verify", promptText: "Validate configuration — check file existence, config syntax, parent refs, and gitignore." },
      { label: "refresh", description: "Update config preserving edits", command: "/init-project refresh", promptText: "Update existing config — preserve manual edits, merge new detections, phases 0-7 merge mode." },
      { label: "status", description: "Show init state", command: "/init-project status", promptText: "Show the current initialization state by listing .opencode/state/init/ and checkpoint progress." },
      { label: "map-codebase", description: "Analyze brownfield codebase", command: "/init-project map-codebase", promptText: "Spawn parallel agents to map this codebase: stack, architecture, conventions, and integration points." },
      { label: "doctor", description: "Diagnostic health check", command: "/init-project doctor", promptText: "Validate JOC installation: config integrity, state consistency, hook status, and dependency health." }
    ]
  },
  {
    name: "ideation",
    title: "Ideation",
    description: "Planning, research, and ideation hub",
    subcommands: [
      { label: "plan", description: "Strategic planning", command: "/ideation plan", promptText: "Interview-style strategic planning. Clarify goals, identify constraints, break into ordered tasks with acceptance criteria." },
      { label: "refine", description: "Diverge/converge iteration", command: "/ideation refine", promptText: "Diverge/converge iteration. Expand the idea through structured brainstorming, then converge on the strongest version." },
      { label: "deep", description: "Socratic interview", command: "/ideation deep", promptText: "Socratic interview with ambiguity gating — crystallize requirements through probing questions." },
      { label: "graph", description: "Relationship mapping", command: "/ideation graph", promptText: "Map relationships, dependencies, and tradeoffs visually as a graph to reveal hidden structure." },
      { label: "research", description: "Multi-model synthesis", command: "/ideation research", promptText: "Multi-model synthesis — gather diverse perspectives and merge them into a coherent, cross-referenced answer." },
      { label: "ralplan", description: "Consensus planning", command: "/ideation ralplan", promptText: "Consensus planning gate — validate the plan is concrete enough to execute, run interview if not." },
      { label: "ddd", description: "Domain-driven design", command: "/ideation ddd", promptText: "Explore bounded contexts, model aggregates and domain events using Domain-Driven Design." },
      { label: "event-storming", description: "Domain exploration", command: "/ideation event-storming", promptText: "Model domain events, commands, and aggregates on a timeline using Event Storming." },
      { label: "double-diamond", description: "Discover→Define→Develop→Deliver", command: "/ideation double-diamond", promptText: "Guide through the four-phase Double Diamond design council framework: Discover→Define→Develop→Deliver." },
      { label: "jtbd", description: "Jobs-to-be-done analysis", command: "/ideation jtbd", promptText: "Frame requirements around customer functional jobs using Jobs-to-be-Done analysis." },
      { label: "impact-mapping", description: "Goal→Actor→Impact→Deliverable", command: "/ideation impact-mapping", promptText: "Map goals through actors to measurable deliverables using Impact Mapping." },
      { label: "spiral", description: "Risk-driven iterations", command: "/ideation spiral", promptText: "Plan iterations targeting highest-risk items first using the Spiral model." },
      { label: "top-down", description: "Vision-to-component decomposition", command: "/ideation top-down", promptText: "Decompose from high-level vision to components using top-down analysis." },
      { label: "bottom-up", description: "Compose from primitives", command: "/ideation bottom-up", promptText: "Build up from existing capabilities into composed systems using bottom-up composition." },
      { label: "adversarial-debate", description: "Spec debate", command: "/ideation adversarial-debate", promptText: "Run adversarial debate: Proposer vs critics debate spec quality with judge convergence." },
      { label: "cleanroom", description: "Formal correctness", command: "/ideation cleanroom", promptText: "Box structure specs with statistical usage testing and MTTF certification (Cleanroom)." },
      { label: "pwf", description: "Files-as-disk planning", command: "/ideation pwf", promptText: "Three-file pattern with filesystem as disk and quality convergence scoring (PWF planning)." },
      { label: "rpikit", description: "Research-Plan-Implement", command: "/ideation rpikit", promptText: "Iron Law — understand problem domain before touching any code. Research then plan then implement." },
      { label: "constitution", description: "Project governance", command: "/ideation constitution", promptText: "Establish quality, UX, performance, and security governing principles as project constitution." },
      { label: "resume", description: "Resume last ideation session", command: "/ideation resume", promptText: "Resume last ideation session — load most recent in-progress work from .opencode/state/ideation/work-products/." },
      { label: "status", description: "Show ideation state", command: "/ideation status", promptText: "Show ideation state — list state files and checkpoints in .opencode/state/ideation/." }
    ]
  },
  {
    name: "orchestrate",
    title: "Orchestrate",
    description: "Execution hub — pick pattern, load plan, build",
    subcommands: [
      { label: "ralph", description: "Persistent loop", command: "/orchestrate ralph", promptText: "Persistent execution loop — keep working until the task is verified complete. Won't stop early." },
      { label: "team", description: "N coordinated agents", command: "/orchestrate team", promptText: "N coordinated agents on a shared task list with real-time messaging and parallel execution." },
      { label: "deep", description: "Causal trace", command: "/orchestrate deep", promptText: "2-stage pipeline: causal trace to find root cause, then deep interview to crystallize requirements." },
      { label: "ccg", description: "Multi-model synthesis", command: "/orchestrate ccg", promptText: "Multi-model synthesis — query diverse models and merge their perspectives into one answer." },
      { label: "ultrawork", description: "Max parallel", command: "/orchestrate ultrawork", promptText: "Maximum parallel execution — execute all independent tasks simultaneously for high throughput." },
      { label: "autopilot", description: "Full autonomous", command: "/orchestrate autopilot", promptText: "Full autonomous execution from idea to working code — handles everything end-to-end." },
      { label: "sciomc", description: "Parallel scientists", command: "/orchestrate sciomc", promptText: "Parallel scientist agents for comprehensive analysis — run multiple analysts concurrently." },
      { label: "swarm", description: "Architect-led 11-agent team", command: "/orchestrate swarm", promptText: "Architect-led swarm with coder, reviewer, test engineer, critic — gated QA pipeline." },
      { label: "state-machine", description: "States with transitions", command: "/orchestrate state-machine", promptText: "Model workflow as state machine with guard conditions and agents as state implementations." },
      { label: "consensus", description: "Voting / weighting agents", command: "/orchestrate consensus", promptText: "Run agents independently then aggregate via voting or weighted synthesis." },
      { label: "evolutionary", description: "Incremental generations", command: "/orchestrate evolutionary", promptText: "Evolve solutions through incremental generations with fitness validation and tournament selection." },
      { label: "spec-driven", description: "Spec-first approach", command: "/orchestrate spec-driven", promptText: "Formalize specification, validate it, then implement against it with strict adherence." },
      { label: "plan-execute", description: "Plan then execute", command: "/orchestrate plan-execute", promptText: "Build complete plan, then execute step by step with verification at each step." },
      { label: "gsd", description: "Discuss→Plan→Execute→Verify→Ship", command: "/orchestrate gsd", promptText: "Full GSD pipeline — discuss, research and plan, execute in waves, verify, ship via PR." },
      { label: "self-assess", description: "Self-evaluate and refine", command: "/orchestrate self-assess", promptText: "Execute then critically evaluate against thresholds, reflect and refine iteratively." },
      { label: "remediate", description: "Auto-fix build failures", command: "/orchestrate remediate", promptText: "Monitor builds, analyze root causes, auto-apply fixes, re-run until green." },
      { label: "devin", description: "Plan→Code→Debug→Deploy", command: "/orchestrate devin", promptText: "Autonomous pipeline with iterative debugging and root-cause analysis cycles." },
      { label: "maestro", description: "Strict role separation", command: "/orchestrate maestro", promptText: "PMs gather requirements, Architects design/review, Coders implement/test — enforced role boundaries." },
      { label: "metaswarm", description: "12-agent 7-phase pipeline", command: "/orchestrate metaswarm", promptText: "Adversarial reviews with fresh reviewers, blocking quality gates, 100% coverage targets." },
      { label: "cc10x", description: "Intent-detecting router", command: "/orchestrate cc10x", promptText: "Route to BUILD/DEBUG/REVIEW/PLAN workflows with evidence-first validation." },
      { label: "gastown", description: "GUPP with git work units", command: "/orchestrate gastown", promptText: "If work on your hook, you MUST run it — NDI for reliable multi-agent outcomes." },
      { label: "ruflo", description: "Q-Learning smart swarm", command: "/orchestrate ruflo", promptText: "60+ agents with Q-Learning routing and Queen/Worker hierarchical topologies." },
      { label: "harden", description: "Add robustness layers", command: "/orchestrate harden", promptText: "Wrap workflow with safeTask, circuitBreaker, and verificationGate composables." },
      { label: "brownfield", description: "Feature on existing codebase", command: "/orchestrate brownfield", promptText: "Analyze existing system, identify integration points, validate before implementing." },
      { label: "vibe-code", description: "Conversational prototyping", command: "/orchestrate vibe-code", promptText: "Describe in natural language, generate full-stack, iterate through conversational feedback rounds." },
      { label: "resume", description: "Resume last orchestration session", command: "/orchestrate resume", promptText: "Resume last orchestration session — load latest checkpoint from .opencode/state/orchestration/checkpoints/." },
      { label: "status", description: "Show orchestration state", command: "/orchestrate status", promptText: "Show orchestration state — list state files in .opencode/state/orchestration/." }
    ]
  },
  {
    name: "harvest-context",
    title: "Harvest Context",
    description: "Context and artifact hub",
    subcommands: [
      { label: "session", description: "Extract session patterns", command: "/harvest-context session", promptText: "Extract decisions, patterns, and learnings from the current session." },
      { label: "codebase", description: "Generate AGENTS.md", command: "/harvest-context codebase", promptText: "Generate hierarchical AGENTS.md documentation across the entire codebase using deepinit." },
      { label: "skill", description: "Create a skill", command: "/harvest-context skill", promptText: "Create a reusable skill from this session's knowledge using skill-creator." },
      { label: "agent", description: "Create an agent", command: "/harvest-context agent", promptText: "Create a project-specific agent with defined purpose, tools, and persona." },
      { label: "command", description: "Create a slash command", command: "/harvest-context command", promptText: "Create a project slash command with trigger, arguments, and behavior definition." },
      { label: "memory", description: "Promote to memory", command: "/harvest-context memory", promptText: "Promote durable knowledge to project memory, notepad, or wiki — classify what goes where." },
      { label: "docs", description: "Fetch library docs", command: "/harvest-context docs", promptText: "Fetch official library documentation for any package using Context7 MCP." },
      { label: "decompose", description: "Break into actionable units", command: "/harvest-context decompose", promptText: "Break down a concept or goal into smaller, ordered, actionable units." },
      { label: "context", description: "Manage context files", command: "/harvest-context context", promptText: "Manage context files — harvest, extract, organize, compact, or map project context." },
      { label: "compress", description: "Token compression", command: "/harvest-context compress", promptText: "Apply 4-layer compression for 50-67% token savings." },
      { label: "secondbrain", description: "Local knowledge base", command: "/harvest-context secondbrain", promptText: "Set up markdown+Git knowledge base with role packs and self-healing cross-references." },
      { label: "journal", description: "Event-sourced journal", command: "/harvest-context journal", promptText: "Set up deterministic replay, time-travel debugging, and audit trails." }
    ]
  },
  {
    name: "project",
    title: "Project Ops",
    description: "Project operations — tests, git, optimization",
    subcommands: [
      { label: "tests", description: "Generate test suite", command: "/project tests", promptText: "Generate comprehensive test suite — 8 test types: unit, integration, e2e, snapshot, property, mutation, fuzz, contract." },
      { label: "commit", description: "Conventional commit", command: "/project commit", promptText: "Create a well-formatted conventional commit message — stage changes and write commit." },
      { label: "stage", description: "Stage changes", command: "/project stage", promptText: "Stage git changes from this conversation thread — identify and stage changed files." },
      { label: "pr", description: "Manage PRs", command: "/project pr", promptText: "Create, view, merge, or manage pull requests via GitHub CLI." },
      { label: "gh", description: "GitHub operations", command: "/project gh", promptText: "Full GitHub CLI operations — PRs, issues, searches, and repository management." },
      { label: "changelog", description: "Changelog", command: "/project changelog", promptText: "Generate a user-facing changelog from git commits — analyze and categorize changes." },
      { label: "optimize", description: "Optimize code", command: "/project optimize", promptText: "Analyze and improve code performance and security — find optimization opportunities." },
      { label: "icon", description: "Generate icons", command: "/project icon", promptText: "Generate web/PWA/UE icon assets from a source SVG or PNG image." },
      { label: "organize", description: "File organization", command: "/project organize", promptText: "Find duplicates, suggest better file structures, and automate cleanup." },
      { label: "analyze", description: "Analyze patterns", command: "/project analyze", promptText: "Find code patterns and anti-patterns across the codebase — improvement opportunities." },
      { label: "converge", description: "5-gate quality convergence", command: "/project converge", promptText: "Run functional/lint/type/security/perf gates with progressive targets." },
      { label: "scan", description: "Security scan", command: "/project scan", promptText: "Run SAST, secrets detection, dependency audit, and compliance checks." },
      { label: "sandbox", description: "Sandbox enforcement", command: "/project sandbox", promptText: "Define policy-based tool, file, and network controls for agent calls." },
      { label: "retrospect", description: "Post-run analysis", command: "/project retrospect", promptText: "Extract lessons, classify errors, compute metrics, and write retrospective." },
      { label: "purge", description: "Clean stale state", command: "/project purge", promptText: "Purge old orchestration runs, free disk space, preserve recent history." }
    ]
  }
]

const tui: TuiPlugin = async (api: TuiPluginApi, _options: PluginOptions | undefined, _meta: TuiPluginMeta) => {
  /**
   * Submit prompt text to the LLM.
   *
   * HOME route: navigate to a new session with the prompt text, then
   * use client.session.prompt() to start the conversation.
   * IN-SESSION: prompt() the current session directly.
   */
  async function submitPrompt(promptText: string) {
    const route = api.route.current

    // Already in a session — prompt it directly
    if (route.name === "session" && route.params?.sessionID) {
      try {
        const sid = route.params.sessionID as string
        const result: any = await api.client.session.prompt({
          sessionID: sid,
          parts: [{ type: "text", text: promptText }],
        })
        // prompt() returns { data, error, response } — data is truthy on success
        if (result && !result.error) return
        console.error("[joc-tui] In-session prompt rejected:", result?.error)
      } catch (e: any) {
        console.error("[joc-tui] In-session prompt threw:", e?.message || e)
      }
    }

    // HOME route (or session prompt failed): create new session → prompt → navigate
    try {
      const createResult: any = await api.client.session.create({
        title: promptText.replace(/\n/g, " ").substring(0, 80),
      })
      const session = createResult?.data
      if (session?.id) {
        const promptResult: any = await api.client.session.prompt({
          sessionID: session.id,
          parts: [{ type: "text", text: promptText }],
        })
        if (promptResult && !promptResult.error) {
          // Navigate to the new session so user sees the response
          api.route.navigate("session", { sessionID: session.id })
          return
        }
        console.error("[joc-tui] Session prompt rejected:", promptResult?.error)
      } else {
        console.error("[joc-tui] Session create returned no id:", createResult)
      }
    } catch (e: any) {
      console.error("[joc-tui] Session create/prompt threw:", e?.message || e)
    }
  }

  // Register all hub commands in a single call.
  // Each hub opens a DialogSelect with its subcommands.
  api.command.register(() =>
    HUBS.map(hub => {
      const options: TuiDialogSelectOption<string>[] = hub.subcommands.map(sub => ({
        title: sub.label,
        value: sub.label,
        description: sub.description
      }))

      function showDialog() {
        const DialogSelect = api.ui.DialogSelect
        api.ui.dialog.setSize("large")
        api.ui.dialog.replace(() => DialogSelect({
          title: `${hub.title} — Select Subcommand`,
          placeholder: "Choose an action...",
          options,
          onSelect: (selected: TuiDialogSelectOption<string>) => {
            api.ui.dialog.clear()
            const sub = hub.subcommands.find(s => s.label === selected.value)
            if (!sub) return

            // Build routing-aware prompt so the LLM knows which hub/subcommand was selected
            // and delegates via hubMenu tool. The CRITICAL guard prevents double-execution
            // by blocking direct skill/agent invocation before hubMenu is called.
            const routingPrompt = `[TUI HUB ROUTING: /${hub.name} ${sub.label}]
DO NOT invoke any skill, agent, or command directly.
STEP 1 (REQUIRED): Call hubMenu(action="route", hub="${hub.name}", subcommand="${sub.label}").
STEP 2: hubMenu returns a delegation object { type, target } and a reminder string. Follow ONLY that reminder text. Invoke ONLY the target returned by hubMenu.
Selected: ${hub.title} → ${sub.label}
Context: ${sub.promptText}`
            submitPrompt(routingPrompt)
          }
        }))
      }

      return {
        title: hub.title,
        value: hub.name,
        description: hub.description,
        category: "JOC Hubs",
        slash: { name: hub.name },
        onSelect: () => showDialog()
      }
    })
  )
}

const plugin = {
  id: "joc-tui-hubs",
  tui
}

export default plugin
