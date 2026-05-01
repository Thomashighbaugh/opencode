/** @jsxImportSource @opentui/solid */
import type { TuiPlugin, TuiPluginApi, PluginOptions, TuiPluginMeta, TuiDialogSelectOption, TuiPromptRef, TuiPromptInfo } from '@opencode-ai/plugin/tui'

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
      { label: "setup", description: "Full project setup", command: "/init-project setup", promptText: "Full init from scratch. I'll verify global JOC, detect your stack, scaffold config, generate docs, and validate." },
      { label: "detect", description: "Detect language, framework, build tools", command: "/init-project detect", promptText: "Detecting your project stack. I'll identify language, framework, package manager, build system, and CI." },
      { label: "docs", description: "Generate hierarchical AGENTS.md", command: "/init-project docs", promptText: "Generating codebase documentation. Run deepinit to create hierarchical AGENTS.md files." },
      { label: "context", description: "Capture session knowledge", command: "/init-project context", promptText: "Capturing session knowledge. Run the remember skill to promote insights to project memory." },
      { label: "verify", description: "Validate configuration", command: "/init-project verify", promptText: "Validating configuration. Use the verifier agent to check config completeness." },
      { label: "refresh", description: "Update config preserving edits", command: "/init-project refresh", promptText: "Updating existing config. Run /init-project with refresh mode, preserving manual edits." },
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
      { label: "plan", description: "Strategic planning", command: "/ideation plan", promptText: "Use the plan skill for interview-style strategic planning. Clarify goals, identify constraints, break into ordered tasks with acceptance criteria." },
      { label: "refine", description: "Diverge/converge iteration", command: "/ideation refine", promptText: "Use the idea-refine skill. Expand my idea through structured brainstorming, then converge on the strongest version." },
      { label: "deep", description: "Socratic interview", command: "/ideation deep", promptText: "Use the deep-interview skill. Socratic interview with ambiguity gating — crystallize requirements." },
      { label: "graph", description: "Relationship mapping", command: "/ideation graph", promptText: "Use the graph-thinking skill to map relationships, dependencies, and tradeoffs as a graph." },
      { label: "research", description: "Multi-model synthesis", command: "/ideation research", promptText: "Use the ccg skill for multi-model synthesis of diverse perspectives into a coherent answer." },
      { label: "ralplan", description: "Consensus planning", command: "/ideation ralplan", promptText: "Use the ralplan skill. Consensus planning gate — validate the plan is concrete enough to execute." },
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
      { label: "constitution", description: "Project governance", command: "/ideation constitution", promptText: "Establish quality, UX, performance, and security governing principles as project constitution." }
    ]
  },
  {
    name: "orchestrate",
    title: "Orchestrate",
    description: "Execution hub — pick pattern, load plan, build",
    subcommands: [
      { label: "ralph", description: "Persistent loop", command: "/orchestrate ralph", promptText: "Use the ralph skill. Persistent loop — keep working until the task is verified complete." },
      { label: "team", description: "N coordinated agents", command: "/orchestrate team", promptText: "Use the team skill. Spin up N coordinated agents on a shared task list with real-time messaging." },
      { label: "deep", description: "Causal trace", command: "/orchestrate deep", promptText: "Use the deep-dive skill. 2-stage: causal trace then deep interview to crystallize requirements." },
      { label: "ccg", description: "Multi-model synthesis", command: "/orchestrate ccg", promptText: "Use the ccg skill. Multi-model synthesis — query diverse models and merge perspectives." },
      { label: "ultrawork", description: "Max parallel", command: "/orchestrate ultrawork", promptText: "Use the ultrawork skill. Maximum parallel execution for high-throughput tasks." },
      { label: "autopilot", description: "Full autonomous", command: "/orchestrate autopilot", promptText: "Use the autopilot skill. Full autonomous execution from idea to working code." },
      { label: "sciomc", description: "Parallel scientists", command: "/orchestrate sciomc", promptText: "Use the sciomc skill. Parallel scientist agents for comprehensive analysis." },
      { label: "swarm", description: "Architect-led 11-agent team", command: "/orchestrate swarm", promptText: "Use the opencode-swarm plugin — architect-led team with gated QA pipeline." },
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
      { label: "vibe-code", description: "Conversational prototyping", command: "/orchestrate vibe-code", promptText: "Describe in natural language, generate full-stack, iterate through conversational feedback rounds." }
    ]
  },
  {
    name: "harvest-context",
    title: "Harvest Context",
    description: "Context and artifact hub",
    subcommands: [
      { label: "session", description: "Extract session patterns", command: "/harvest-context session", promptText: "Extract decisions, patterns, and learnings from the current session." },
      { label: "codebase", description: "Generate AGENTS.md", command: "/harvest-context codebase", promptText: "Generate hierarchical AGENTS.md documentation across the entire codebase using deepinit." },
      { label: "skill", description: "Create a skill", command: "/harvest-context skill", promptText: "Use skill-creator to create a reusable skill from this session's knowledge." },
      { label: "agent", description: "Create an agent", command: "/harvest-context agent", promptText: "Use opencode-agent-creator to create a project-specific agent." },
      { label: "rule", description: "Create a project rule", command: "/harvest-context rule", promptText: "Create a project rule file in .opencode/rules/." },
      { label: "command", description: "Create a slash command", command: "/harvest-context command", promptText: "Use opencode-command-creator to create a project slash command." },
      { label: "memory", description: "Promote to memory", command: "/harvest-context memory", promptText: "Use the remember skill to promote durable knowledge to project memory, notepad, or wiki." },
      { label: "docs", description: "Fetch library docs", command: "/harvest-context docs", promptText: "Use Context7 MCP to fetch official library documentation for any package." },
      { label: "decompose", description: "Break into actionable units", command: "/harvest-context decompose", promptText: "Use the planner agent to break down this concept into smaller actionable units." },
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
      { label: "commit", description: "Conventional commit", command: "/project commit", promptText: "Use the conventional-commit skill to create a well-formatted commit message." },
      { label: "stage", description: "Stage changes", command: "/project stage", promptText: "Use the git-stage-thread command to stage changes from this conversation." },
      { label: "pr", description: "Manage PRs", command: "/project pr", promptText: "Use the pr command to create, view, merge, or manage pull requests." },
      { label: "gh", description: "GitHub operations", command: "/project gh", promptText: "Use the github-ops skill for full GitHub CLI operations." },
      { label: "changelog", description: "Changelog", command: "/project changelog", promptText: "Use the changelog-generator skill to create a user-facing changelog from commits." },
      { label: "optimize", description: "Optimize code", command: "/project optimize", promptText: "Use the optimize command to analyze and improve code performance and security." },
      { label: "icon", description: "Generate icons", command: "/project icon", promptText: "Use the icon-generator skill to generate web/PWA/UE icon assets from a source image." },
      { label: "organize", description: "File organization", command: "/project organize", promptText: "Use the file-organizer skill to find duplicates and suggest better structures." },
      { label: "analyze", description: "Analyze patterns", command: "/project analyze", promptText: "Use the analyze-patterns command to find code patterns and anti-patterns." },
      { label: "converge", description: "5-gate quality convergence", command: "/project converge", promptText: "Run functional/lint/type/security/perf gates with progressive targets." },
      { label: "scan", description: "Security scan", command: "/project scan", promptText: "Run SAST, secrets detection, dependency audit, and compliance checks." },
      { label: "sandbox", description: "Sandbox enforcement", command: "/project sandbox", promptText: "Define policy-based tool, file, and network controls for agent calls." },
      { label: "retrospect", description: "Post-run analysis", command: "/project retrospect", promptText: "Extract lessons, classify errors, compute metrics, and write retrospective." },
      { label: "purge", description: "Clean stale state", command: "/project purge", promptText: "Purge old orchestration runs, free disk space, preserve recent history." }
    ]
  }
]

const tui: TuiPlugin = async (api: TuiPluginApi, _options: PluginOptions | undefined, _meta: TuiPluginMeta) => {
  // Capture TuiPromptRef from both home and session prompt slots.
  // When available, we can set text + submit directly — the most reliable approach.
  let homePromptRef: TuiPromptRef | undefined
  let sessionPromptRef: TuiPromptRef | undefined

  try {
    api.slots.register({
      id: "joc-hub-prompt-capture",
      init(props: Record<string, unknown>) { return props },
      slots: {
        home_prompt: {
          ref: (ref: TuiPromptRef | undefined) => {
            if (ref) homePromptRef = ref
          }
        },
        session_prompt: {
          ref: (ref: TuiPromptRef | undefined) => {
            if (ref) sessionPromptRef = ref
          }
        }
      }
    } as any)
  } catch {
    // Slot registration may fail if slots are already occupied.
    // We fall back to session.prompt() and command.trigger() below.
  }

  /**
   * Submit prompt text to the LLM using the best available strategy.
   *
   * Strategy 1: TuiPromptRef.set() + submit() — puts text in the input box and hits enter.
   *   Works on home (creates new session) and in-session (appends to current session).
   * Strategy 2: api.client.session.prompt() — SDK-level send, works only in-session.
   * Strategy 3: api.command.trigger() — opens command palette with the text as fallback.
   */
  function submitPrompt(promptText: string) {
    // Strategy 1: Use captured prompt ref (most reliable)
    const isHome = api.route.current.name !== "session"
    const ref = isHome ? homePromptRef : sessionPromptRef

    if (ref) {
      const info: TuiPromptInfo = {
        input: promptText,
        mode: "normal",
        parts: [{ type: "text", text: promptText }]
      }
      ref.set(info)
      ref.submit()
      return
    }

    // Strategy 2: Use SDK client (in-session only)
    const route = api.route.current
    if (route.name === "session" && route.params?.sessionID) {
      try {
        api.client.session.prompt({
          sessionID: route.params.sessionID as string,
          parts: [{ type: "text" as const, text: promptText }]
        })
        return
      } catch {}
    }

    // Strategy 3: Trigger as command (fallback — opens command palette)
    api.command.trigger(promptText)
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
            submitPrompt(sub.promptText)
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
