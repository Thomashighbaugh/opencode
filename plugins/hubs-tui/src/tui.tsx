/** @jsxImportSource @opentui/solid */
import type { TuiPlugin, TuiPluginApi, TuiPluginMeta, TuiDialogSelectOption } from '@opencode-ai/plugin/tui'

interface Sub { label: string; description: string }
interface Hub { name: string; title: string; description: string; subs: Sub[] }

const HUBS: Hub[] = [
  { name: "init-project", title: "Init Project", description: "Initialize or refine project setup", subs: [
    { label: "setup", description: "Full project setup" },
    { label: "detect", description: "Detect language, framework, build tools" },
    { label: "docs", description: "Generate hierarchical AGENTS.md" },
    { label: "context", description: "Capture session knowledge" },
    { label: "verify", description: "Validate configuration" },
    { label: "refresh", description: "Update config preserving edits" },
    { label: "status", description: "Show init state" },
    { label: "map-codebase", description: "Analyze brownfield codebase" },
    { label: "doctor", description: "Diagnostic health check" },
    { label: "reset", description: "Reset project state to clean slate" },
    { label: "provision", description: "Analyze codebase and auto-generate project-specific agents, skills, tools, and rules in .opencode/" },
  ]},
  { name: "ideation", title: "Ideation", description: "Planning, research, and ideation hub", subs: [
    { label: "plan", description: "Strategic planning" },
    { label: "brainstorm", description: "Free-form idea generation" },
    { label: "refine", description: "Diverge/converge iteration" },
    { label: "overhaul", description: "Analyze project across 8 dimensions — produce phased improvement plan" },
    { label: "deep", description: "Socratic interview" },
    { label: "graph", description: "Relationship mapping" },
    { label: "research", description: "Multi-model synthesis" },
    { label: "ralplan", description: "Consensus planning" },
    { label: "ddd", description: "Domain-driven design" },
    { label: "event-storming", description: "Domain exploration" },
    { label: "double-diamond", description: "Discover→Define→Develop→Deliver" },
    { label: "jtbd", description: "Jobs-to-be-done analysis" },
    { label: "impact-mapping", description: "Goal→Actor→Impact→Deliverable" },
    { label: "spiral", description: "Risk-driven iterations" },
    { label: "top-down", description: "Vision-to-component decomposition" },
    { label: "bottom-up", description: "Compose from primitives" },
    { label: "adversarial-debate", description: "Spec debate" },
    { label: "cleanroom", description: "Formal correctness" },
    { label: "pwf", description: "Files-as-disk planning" },
    { label: "rpikit", description: "Research-Plan-Implement" },
    { label: "hive", description: "Agent Hive planning — Architect Bee" },
    { label: "story-mapping", description: "User story mapping" },
    { label: "lean-canvas", description: "Lean business model canvas" },
    { label: "constitution", description: "Project governance" },
    { label: "decomposition", description: "Decompose a task into actionable subtasks — break complex work into ordered, verifiable steps" },
    { label: "quality", description: "Deep-dive code quality audit — complexity, duplication, naming, error handling gaps" },
    { label: "modularity", description: "Module boundary analysis — coupling, cohesion, circular deps, god modules" },
    { label: "arch-prep", description: "Architecture runway for upcoming features — extension points, module plan, refactoring needs" },
    { label: "resume", description: "Resume last ideation session" },
    { label: "status", description: "Show ideation state" },
  ]},
  { name: "orchestrate", title: "Orchestrate", description: "Execution hub — pick pattern, load plan, build", subs: [
    { label: "ralph", description: "Persistent loop" },
    { label: "team", description: "N coordinated agents" },
    { label: "deep", description: "Causal trace" },
    { label: "ccg", description: "Multi-model synthesis" },
    { label: "ultrawork", description: "Max parallel" },
    { label: "autopilot", description: "Full autonomous" },
    { label: "sciomc", description: "Parallel scientists" },
    { label: "swarm", description: "Architect-led 11-agent team" },
    { label: "state-machine", description: "States with transitions" },
    { label: "consensus", description: "Voting / weighting agents" },
    { label: "evolutionary", description: "Incremental generations" },
    { label: "spec-driven", description: "Spec-first approach" },
    { label: "react", description: "ReAct — Reasoning + Acting loop" },
    { label: "plan-execute", description: "Plan then execute" },
    { label: "hive", description: "Agent Hive execution — Swarm Bee" },
    { label: "tdd", description: "Test-driven development loop" },
    { label: "pair", description: "Pair programming — Driver/Navigator" },
    { label: "pipeline", description: "Multi-stage pipeline" },
    { label: "gsd", description: "Discuss→Plan→Execute→Verify→Ship" },
    { label: "self-assess", description: "Self-evaluate and refine" },
    { label: "remediate", description: "Auto-fix build failures" },
    { label: "devin", description: "Plan→Code→Debug→Deploy" },
    { label: "maestro", description: "Strict role separation" },
    { label: "metaswarm", description: "12-agent 7-phase pipeline" },
    { label: "cc10x", description: "Intent-detecting router" },
    { label: "gastown", description: "GUPP with git work units" },
    { label: "ruflo", description: "Q-Learning smart swarm" },
    { label: "harden", description: "Add robustness layers" },
    { label: "brownfield", description: "Feature on existing codebase" },
    { label: "vibe-code", description: "Conversational prototyping" },
    { label: "resume", description: "Resume last orchestration session" },
    { label: "status", description: "Show orchestration state" },
  ]},
  { name: "harvest-context", title: "Harvest Context", description: "Context and artifact hub", subs: [
    { label: "session", description: "Extract session patterns" },
    { label: "codebase", description: "Generate AGENTS.md" },
    { label: "skill", description: "Create a skill" },
    { label: "agent", description: "Create an agent" },
    { label: "command", description: "Create a slash command" },
    { label: "memory", description: "Promote to memory" },
    { label: "docs", description: "Fetch library docs" },
    { label: "decompose", description: "Break into actionable units" },
    { label: "context", description: "Manage context files" },
    { label: "consume", description: "Ingest file/directory/URL into context" },
    { label: "compress", description: "Token compression" },
    { label: "secondbrain", description: "Local knowledge base" },
    { label: "journal", description: "Event-sourced journal" },
    { label: "search", description: "Search across context files" },
    { label: "prune", description: "Stale context management" },
    { label: "export", description: "Export context as report" },
    { label: "diff", description: "Context diff since last harvest" },
    { label: "rule", description: "Create a project rule (.opencode/rules/)" },
    { label: "sweep", description: "Scan .opencode/ for files that should be gitignored but aren't — prevents bloat that breaks git push" },
  ]},
  { name: "project", title: "Project Ops", description: "Project operations — tests, git, code refactoring, optimization", subs: [
    { label: "tests", description: "Generate test suite" },
    { label: "commit", description: "Conventional commit" },
    { label: "stage", description: "Stage changes" },
    { label: "pr", description: "Manage PRs" },
    { label: "gh", description: "GitHub operations" },
    { label: "changelog", description: "Changelog" },
    { label: "optimize", description: "Optimize code" },
    { label: "refactor", description: "Restructure code without changing behavior" },
    { label: "simplify", description: "Reduce code complexity — flatten nesting, simplify conditionals" },
    { label: "cleanup", description: "Remove AI slop — dead code, unused exports, redundant comments" },
    { label: "modernize", description: "Update code to modern language/framework conventions" },
    { label: "icon", description: "Generate icons" },
    { label: "organize", description: "File organization" },
    { label: "analyze", description: "Analyze patterns" },
    { label: "converge", description: "5-gate quality convergence" },
    { label: "scan", description: "Security scan" },
    { label: "sandbox", description: "Sandbox enforcement" },
    { label: "retrospect", description: "Post-run analysis" },
    { label: "purge", description: "Clean stale state" },
    { label: "release", description: "Tag and release" },
    { label: "review", description: "Full code review" },
    { label: "audit", description: "Project health audit" },
    { label: "archive", description: "Archive stale branches/artifacts" },
    { label: "workspace", description: "Manage .opencode across projects" },
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