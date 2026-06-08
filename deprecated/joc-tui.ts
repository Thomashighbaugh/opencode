/**
 * OpenCode Hubs TUI Plugin — Instant Hub Command Routing
 *
 * Provides instant (no LLM inference) hub command menus via DialogSelect.
 * When a user invokes /init-project, /ideation, /orchestrate, /harvest-context,
 * or /project, this plugin renders a submenu immediately, then submits the
 * routed prompt text to the session for the LLM to process.
 *
 * Architecture:
 * - TuiPluginModule (exports { tui }) — registered separately from server plugin
 * - Registers 5 slash commands via api.command.register()
 * - On selection, renders DialogSelect instantly (no LLM call)
 * - On pick, injects prompt text via TuiPromptRef + submit()
 * - Fallback: uses api.command.trigger() if no prompt ref available
 *
 * @module hubs-tui
 */

import type { TuiPlugin, TuiPluginApi, TuiPluginMeta, TuiCommand, TuiDialogSelectOption, TuiDialogSelectProps, TuiPromptRef, TuiPromptInfo } from "@opencode-ai/plugin/tui"
import type { PluginOptions } from "@opencode-ai/plugin"

type JSXElement = unknown

interface HubSubcommand {
  label: string
  description: string
  skill?: string
  agent?: string
  command?: string
  inline?: boolean
  reminder: string
  phases?: string
  aliases?: string[]
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
      { label: "setup", description: "Full project setup — global Hubs verify, detection, scaffold, docs, context, routing, verify", skill: "init-project", reminder: "Full init from scratch. I'll verify global Hubs, detect your stack, scaffold config, generate docs, and validate.", phases: "0-7" },
      { label: "detect", description: "Detect language, framework, build tools, and key directories", agent: "explore", reminder: "Detecting your project stack. I'll identify language, framework, package manager, build system, and CI.", phases: "0-1" },
      { label: "docs", description: "Generate hierarchical AGENTS.md documentation across the codebase", skill: "deepinit", reminder: "Generating codebase documentation. I'll create hierarchical AGENTS.md files across your directories.", phases: "4" },
      { label: "context", description: "Capture session knowledge, promote insights to project memory and docs", skill: "remember", reminder: "Capturing session knowledge. I'll promote insights to project memory, notepad, and AGENTS.md.", phases: "5" },
      { label: "verify", description: "Validate configuration completeness, file existence, and reference integrity", agent: "verifier", reminder: "Validating configuration. I'll check file existence, config syntax, parent refs, and gitignore.", phases: "7" },
      { label: "refresh", description: "Update existing configuration — preserve manual edits, merge new detections", skill: "init-project", reminder: "Updating existing config. I'll preserve your manual edits and merge new detections.", phases: "0-7 (merge)" },
      { label: "status", description: "Show current initialization state and checkpoint progress", inline: true, reminder: "Showing init state and checkpoint progress." }
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
      { label: "ultrawork", description: "Maximum parallel execution for high-throughput tasks", skill: "ultrawork", reminder: "Maximum parallelism. I'll execute all independent tasks simultaneously.", aliases: ["ulw"] },
      { label: "autopilot", description: "Full autonomous execution from idea to working code", skill: "autopilot", reminder: "Full autonomy. From idea to working code — I'll handle everything." },
      { label: "sciomc", description: "Parallel scientist agents for comprehensive analysis", skill: "sciomc", reminder: "Parallel scientists. I'll run multiple analysis agents concurrently for comprehensive coverage." },
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
      { label: "context", description: "Manage context files — harvest, extract, organize, compact, map", inline: true, reminder: "Managing context files. I'll harvest, extract, organize, or compact context." }
    ]
  },
  {
    name: "project",
    description: "Project operations hub — tests, git, optimization, icons, changelogs",
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
      { label: "changelog", description: "Generate user-facing changelog from git commits", skill: "changelog-generator", reminder: "Generating changelog. I'll analyze commits and create a user-facing release notes." }
    ]
  }
]

function buildPromptText(hubName: string, sub: HubSubcommand): string {
  const prompts: Record<string, Record<string, string>> = {
    "init-project": {
      setup: "Run the /init-project skill with setup mode. Full initialization from scratch.",
      detect: "Use the explore agent to detect this project's language, framework, and build tools.",
      docs: "Run the deepinit skill to generate hierarchical AGENTS.md documentation.",
      context: "Run the remember skill to capture session knowledge and promote it to project memory.",
      verify: "Use the verifier agent to validate configuration completeness and file existence.",
      refresh: "Run the /init-project skill with refresh mode. Update existing config while preserving manual edits.",
      status: "Show the current initialization state by listing files in .opencode/state/init/ and any checkpoint progress."
    },
    "ideation": {
      plan: "Use the plan skill for interview-style strategic planning. Clarify goals and break into tasks.",
      refine: "Use the idea-refine skill for diverge/converge iteration on your idea.",
      deep: "Use the deep-interview skill for a Socratic interview with ambiguity gating.",
      graph: "Use the graph-thinking skill to map relationships, dependencies, and tradeoffs.",
      research: "Use the ccg skill for multi-model synthesis of diverse perspectives.",
      ralplan: "Use the ralplan skill to validate your plan is concrete enough to execute.",
      resume: "Resume the last ideation session from .opencode/state/ideation/",
      status: "Show current ideation state by listing .opencode/state/ideation/ files."
    },
    "orchestrate": {
      ralph: "Use the ralph skill. Persistent loop — keep working until the task is verified complete.",
      team: "Use the team skill. Spin up N coordinated agents on a shared task list.",
      deep: "Use the deep-dive skill. 2-stage: trace root cause, then crystallize requirements.",
      ccg: "Use the ccg skill. Multi-model synthesis — query diverse models and merge perspectives.",
      ultrawork: "Use the ultrawork skill. Maximum parallel execution for high-throughput tasks.",
      autopilot: "Use the autopilot skill. Full autonomous execution from idea to working code.",
      sciomc: "Use the sciomc skill. Parallel scientist agents for comprehensive analysis.",
      resume: "Resume the last orchestration session from .opencode/state/orchestration/",
      status: "Show current orchestration state by listing .opencode/state/orchestration/ files."
    },
    "harvest-context": {
      session: "Extract decisions, patterns, and learnings from the current session.",
      codebase: "Use the deepinit skill to generate hierarchical AGENTS.md across the codebase.",
      skill: "Use the skill-creator skill to create a reusable skill from session knowledge.",
      agent: "Use the opencode-agent-creator skill to create a project-specific agent.",
      rule: "Create a project rule file in .opencode/rules/.",
      command: "Use the opencode-command-creator skill to create a project slash command.",
      memory: "Use the remember skill to promote durable knowledge to project memory, notepad, or wiki.",
      docs: "Use Context7 MCP to fetch official library documentation for any package.",
      decompose: "Use the planner agent to break down a concept into smaller actionable units.",
      context: "Manage context files — harvest, extract, organize, compact, or map."
    },
    "project": {
      tests: "Generate comprehensive test suite using the create-tests command.",
      commit: "Use the conventional-commit skill to create a well-formatted commit.",
      stage: "Use the git-stage-thread command to stage git changes from this conversation.",
      pr: "Use the pr command to create, view, merge, or manage pull requests.",
      gh: "Use the github-ops skill for full GitHub CLI operations.",
      optimize: "Use the optimize command to analyze and improve code performance/security.",
      icon: "Use the icon-generator skill to generate web/PWA/UE icon assets.",
      organize: "Use the file-organizer skill to find duplicates and suggest better structures.",
      analyze: "Use the analyze-patterns command to find code patterns and anti-patterns.",
      changelog: "Use the changelog-generator skill to create a user-facing changelog."
    }
  }

  const hubPrompts = prompts[hubName]
  if (hubPrompts && hubPrompts[sub.label]) {
    return hubPrompts[sub.label]
  }

  return sub.reminder
}

export const JocTuiPlugin: TuiPlugin = async (api: TuiPluginApi, _options: PluginOptions | undefined, _meta: TuiPluginMeta): Promise<void> => {
  let promptRef: TuiPromptRef | undefined

  const hubAliases: Record<string, string[]> = {
    "orchestrate": ["orch"],
    "harvest-context": ["harvest"],
    "init-project": ["init"],
    "ideation": ["idea"],
    "project": ["proj"]
  }

  const titleMap: Record<string, string> = {
    "init-project": "Init Project",
    "ideation": "Ideation",
    "orchestrate": "Orchestrate",
    "harvest-context": "Harvest Context",
    "project": "Project Ops"
  }

  // Register each hub as a slash command
  for (const hub of HUBS) {
    const hubName = hub.name
    const aliases = hubAliases[hubName] || []
    const title = titleMap[hubName] || hubName

    const options: TuiDialogSelectOption<string>[] = hub.subcommands.map(sub => ({
      title: sub.label,
      value: sub.label,
      description: sub.description
    }))

    api.command.register(() => [
      {
        title: hub.description,
        value: `/${hubName}`,
        description: hub.description,
        slash: {
          name: hubName,
          aliases: aliases.length > 0 ? aliases : undefined
        },
        onSelect: () => {
          api.ui.dialog.replace(() => {
            return api.ui.DialogSelect({
              title,
              placeholder: "Select a subcommand...",
              options,
              onSelect: (selected: TuiDialogSelectOption<string>) => {
                api.ui.dialog.clear()

                const sub = hub.subcommands.find(s => s.label === selected.value)
                if (!sub) return

                const promptText = buildPromptText(hubName, sub)

                // Strategy 1: Use TuiPromptRef (captured from session_prompt slot)
                if (promptRef) {
                  const info: TuiPromptInfo = {
                    input: promptText,
                    mode: "normal",
                    parts: [{ type: "text", text: promptText }]
                  }
                  promptRef.set(info)
                  promptRef.submit()
                  return
                }

                // Strategy 2: Use SDK client to send message to current session
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
            }) as JSXElement
          })
        }
      } as TuiCommand
    ])
  }

  // Attempt to capture TuiPromptRef from session_prompt slot
  try {
    api.slots.register({
      id: "joc-hub-prompt-capture",
      init(props: Record<string, unknown>) { return props },
      slots: {
        session_prompt: {
          ref: (ref: TuiPromptRef | undefined) => {
            if (ref) promptRef = ref
          }
        }
      }
    } as any)
  } catch {
    // Slot registration may fail if session_prompt is already occupied
    // Falls back to SDK client or command.trigger
  }
}

export default { tui: JocTuiPlugin }