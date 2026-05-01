/** @jsxImportSource @opentui/solid */
import type { TuiPlugin, TuiPluginApi, PluginOptions, TuiPluginMeta, TuiDialogSelectOption } from '@opencode-ai/plugin/tui'

interface HubSubcommand {
  label: string
  description: string
  reminder: string
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
      { label: "setup", description: "Full project setup", reminder: "Run the /init-project skill with setup mode." },
      { label: "detect", description: "Detect language, framework, build tools", reminder: "Use the explore agent to detect this project's stack." },
      { label: "docs", description: "Generate hierarchical AGENTS.md", reminder: "Run deepinit to generate hierarchical AGENTS.md." },
      { label: "context", description: "Capture session knowledge", reminder: "Run the remember skill to capture session knowledge." },
      { label: "verify", description: "Validate configuration", reminder: "Use the verifier agent to validate configuration." },
      { label: "refresh", description: "Update config preserving edits", reminder: "Run /init-project with refresh mode." },
      { label: "status", description: "Show init state", reminder: "Show current initialization state." },
      { label: "map-codebase", description: "Analyze brownfield codebase", reminder: "Spawn parallel agents to map stack, architecture, conventions, and integration points." },
      { label: "doctor", description: "Diagnostic health check", reminder: "Validate JOC installation, config integrity, state consistency, and hook status." }
    ]
  },
  {
    name: "ideation",
    title: "Ideation",
    description: "Planning, research, and ideation hub",
    subcommands: [
      { label: "plan", description: "Strategic planning", reminder: "Use the plan skill for interview-style strategic planning." },
      { label: "refine", description: "Diverge/converge iteration", reminder: "Use the idea-refine skill." },
      { label: "deep", description: "Socratic interview", reminder: "Use the deep-interview skill." },
      { label: "graph", description: "Relationship mapping", reminder: "Use the graph-thinking skill." },
      { label: "research", description: "Multi-model synthesis", reminder: "Use the ccg skill." },
      { label: "ralplan", description: "Consensus planning", reminder: "Use the ralplan skill." },
      { label: "ddd", description: "Domain-driven design", reminder: "Explore bounded contexts, model aggregates and domain events." },
      { label: "event-storming", description: "Domain exploration", reminder: "Model domain events, commands, and aggregates on a timeline." },
      { label: "double-diamond", description: "Discover→Define→Develop→Deliver", reminder: "Guide through the four-phase design council framework." },
      { label: "jtbd", description: "Jobs-to-be-done analysis", reminder: "Frame requirements around customer functional jobs." },
      { label: "impact-mapping", description: "Goal→Actor→Impact→Deliverable", reminder: "Map goals through actors to measurable deliverables." },
      { label: "spiral", description: "Risk-driven iterations", reminder: "Plan iterations targeting highest-risk items first." },
      { label: "top-down", description: "Vision-to-component decomposition", reminder: "Decompose from high-level vision to components." },
      { label: "bottom-up", description: "Compose from primitives", reminder: "Build up from existing capabilities into composed systems." },
      { label: "adversarial-debate", description: "Spec debate", reminder: "Proposer vs critics debate spec quality with judge convergence." },
      { label: "cleanroom", description: "Formal correctness", reminder: "Box structure specs with statistical usage testing and MTTF certification." },
      { label: "pwf", description: "Files-as-disk planning", reminder: "Three-file pattern with filesystem as disk and quality convergence scoring." },
      { label: "rpikit", description: "Research-Plan-Implement", reminder: "Iron Law — understand problem domain before touching any code." },
      { label: "constitution", description: "Project governance", reminder: "Establish quality, UX, performance, and security governing principles." }
    ]
  },
  {
    name: "orchestrate",
    title: "Orchestrate",
    description: "Execution hub — pick pattern, load plan, build",
    subcommands: [
      { label: "ralph", description: "Persistent loop", reminder: "Use the ralph skill." },
      { label: "team", description: "N coordinated agents", reminder: "Use the team skill." },
      { label: "deep", description: "Causal trace", reminder: "Use the deep-dive skill." },
      { label: "ccg", description: "Multi-model synthesis", reminder: "Use the ccg skill." },
      { label: "ultrawork", description: "Max parallel", reminder: "Use the ultrawork skill." },
      { label: "autopilot", description: "Full autonomous", reminder: "Use the autopilot skill." },
      { label: "sciomc", description: "Parallel scientists", reminder: "Use the sciomc skill." },
      { label: "swarm", description: "Architect-led 11-agent team", reminder: "Use the opencode-swarm plugin — architect-led team with gated QA pipeline." },
      { label: "state-machine", description: "States with transitions", reminder: "Model workflow as state machine with guards and agents as states." },
      { label: "consensus", description: "Voting / weighting agents", reminder: "Run agents independently then aggregate via voting or synthesis." },
      { label: "evolutionary", description: "Incremental generations", reminder: "Evolve increments through generations with fitness validation." },
      { label: "spec-driven", description: "Spec-first approach", reminder: "Formalize spec, validate it, implement against it." },
      { label: "plan-execute", description: "Plan then execute", reminder: "Build complete plan, then execute step by step with verification." },
      { label: "gsd", description: "Discuss→Plan→Execute→Verify→Ship", reminder: "Full GSD pipeline — discuss, research and plan, execute in waves, verify, ship via PR." },
      { label: "self-assess", description: "Self-evaluate and refine", reminder: "Execute then critically evaluate against thresholds, reflect and refine iteratively." },
      { label: "remediate", description: "Auto-fix build failures", reminder: "Monitor builds, analyze root causes, auto-apply fixes, re-run until green." },
      { label: "devin", description: "Plan→Code→Debug→Deploy", reminder: "Autonomous pipeline with iterative debugging and root-cause analysis cycles." },
      { label: "maestro", description: "Strict role separation", reminder: "PMs gather, Architects design/review, Coders implement/test — enforced boundaries." },
      { label: "metaswarm", description: "12-agent 7-phase pipeline", reminder: "Adversarial reviews with fresh reviewers, blocking quality gates, 100% coverage targets." },
      { label: "cc10x", description: "Intent-detecting router", reminder: "Route to BUILD/DEBUG/REVIEW/PLAN workflows with evidence-first validation." },
      { label: "gastown", description: "GUPP with git work units", reminder: "If work on your hook, you MUST run it — NDI for reliable multi-agent outcomes." },
      { label: "ruflo", description: "Q-Learning smart swarm", reminder: "60+ agents with Q-Learning routing and Queen/Worker hierarchical topologies." },
      { label: "harden", description: "Add robustness layers", reminder: "Wrap workflow with safeTask, circuitBreaker, and verificationGate composables." },
      { label: "brownfield", description: "Feature on existing codebase", reminder: "Analyze existing system, identify integration points, validate before implementing." },
      { label: "vibe-code", description: "Conversational prototyping", reminder: "Describe in natural language, generate full-stack, iterate through feedback rounds." }
    ]
  },
  {
    name: "harvest-context",
    title: "Harvest Context",
    description: "Context and artifact hub",
    subcommands: [
      { label: "session", description: "Extract session patterns", reminder: "Extract decisions and patterns from the current session." },
      { label: "codebase", description: "Generate AGENTS.md", reminder: "Run deepinit to generate hierarchical AGENTS.md." },
      { label: "skill", description: "Create a skill", reminder: "Use skill-creator to create a skill." },
      { label: "agent", description: "Create an agent", reminder: "Use opencode-agent-creator." },
      { label: "rule", description: "Create a project rule", reminder: "Create a project rule file." },
      { label: "command", description: "Create a slash command", reminder: "Use opencode-command-creator." },
      { label: "memory", description: "Promote to memory", reminder: "Use remember to promote knowledge." },
      { label: "docs", description: "Fetch library docs", reminder: "Fetch library documentation via Context7 MCP." },
      { label: "decompose", description: "Break into actionable units", reminder: "Use the planner agent." },
      { label: "context", description: "Manage context files", reminder: "Manage context files." },
      { label: "compress", description: "Token compression", reminder: "Apply 4-layer compression for 50-67% token savings." },
      { label: "secondbrain", description: "Local knowledge base", reminder: "Set up markdown+Git knowledge base with role packs and self-healing cross-references." },
      { label: "journal", description: "Event-sourced journal", reminder: "Set up deterministic replay, time-travel debugging, and audit trails." }
    ]
  },
  {
    name: "project",
    title: "Project Ops",
    description: "Project operations — tests, git, optimization",
    subcommands: [
      { label: "commit", description: "Conventional commit", reminder: "Use conventional-commit to create a commit." },
      { label: "stage", description: "Stage changes", reminder: "Use git-stage-thread to stage changes." },
      { label: "pr", description: "Manage PRs", reminder: "Use pr command to manage pull requests." },
      { label: "gh", description: "GitHub operations", reminder: "Use github-ops for GitHub CLI operations." },
      { label: "changelog", description: "Changelog", reminder: "Use changelog-generator to create a changelog." },
      { label: "optimize", description: "Optimize code", reminder: "Use optimize command." },
      { label: "icon", description: "Generate icons", reminder: "Use icon-generator skill." },
      { label: "organize", description: "File organization", reminder: "Use file-organizer skill." },
      { label: "analyze", description: "Analyze patterns", reminder: "Use analyze-patterns command." },
      { label: "converge", description: "5-gate quality convergence", reminder: "Run functional/lint/type/security/perf gates with progressive targets." },
      { label: "scan", description: "Security scan", reminder: "Run SAST, secrets detection, dependency audit, compliance checks." },
      { label: "sandbox", description: "Sandbox enforcement", reminder: "Define policy-based tool, file, and network controls for agent calls." },
      { label: "retrospect", description: "Post-run analysis", reminder: "Extract lessons, classify errors, compute metrics, write retrospective." },
      { label: "purge", description: "Clean stale state", reminder: "Purge old orchestration runs, free disk, preserve recent history." }
    ]
  }
]

const tui: TuiPlugin = async (api: TuiPluginApi, _options: PluginOptions | undefined, _meta: TuiPluginMeta) => {
  // Register ALL hub commands in a single call (bytheway pattern).
  // Multiple calls to api.command.register replace previous registrations.
  api.command.register(() =>
    HUBS.map(hub => {
      const options: TuiDialogSelectOption<string>[] = hub.subcommands.map(sub => ({
        title: sub.label,
        value: sub.label,
        description: sub.description
      }))

      function promptSession(text: string) {
        const sessionId = api.route.current.name === "session"
          ? (api.route.current as any).params?.sessionID
          : undefined
        api.client.session.prompt({
          sessionID: sessionId ?? "",
          parts: [{ type: "text" as const, text }]
        }).catch(() => {
          api.command.trigger(text)
        })
      }

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
            promptSession(sub.reminder)
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