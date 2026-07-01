import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "gastown",
  description: "GUPP principle — 'if work on your hook, YOU MUST RUN IT' with git-backed work units and NDI for reliable outcomes from unreliable processes",
  reminder: "Git-backed work units with GUPP principle.",
  inline: true,

  detailedDescription: `Implements the GUPP (Git Unit Pull Principle): "If work is on your hook, YOU MUST RUN IT." Work units are git-backed — each unit is a branch/commit that represents a discrete piece of work. An agent that picks up a unit owns it until it's done.

Key mechanisms:
- Git-backed work units: each task is a git branch. Picking up a task = checking out the branch. Completing = merging.
- NDI (Non-Deterministic Invocation): accepts that LLM calls are non-deterministic, so each work unit is designed to be re-runnable safely. If an agent's attempt fails, another can pick up the branch and continue.
- "On your hook" accountability: once an agent claims a unit, it must run it to completion. No dropping work silently.

Use when you want strong accountability for work units and the ability to recover from agent failures by re-assigning the git-backed unit to a new agent.`,

  tools: ["bash", "listAgents", "modeState", "taskTodos"],
  relatedSkills: [],

  examples: [
    {
      input: "/orchestrate gastown --backlog='issues/*.md' 'process the backlog'",
      approach: "Each issue becomes a git branch. Agent claims issue-42 branch, implements, commits, merges. If it fails mid-way, the branch retains progress; a new agent claims and continues."
    }
  ]
}

export default spec