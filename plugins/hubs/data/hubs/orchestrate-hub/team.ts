import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "team",
  description: "N coordinated agents with shared task list and real-time messaging",
  reminder: "N coordinated agents on shared tasks. Asks: team size.",
  skill: "team",

  detailedDescription: `Spawns N agents that share a single task list (via taskTodos) and exchange messages in real-time. Each agent picks the next available task, works on it, and posts updates that other agents can see. This is OpenCode's native team mode — not external processes.

Use when a task decomposes into mostly-independent subtasks that benefit from parallel execution but need coordination (shared state, dependency ordering, or cross-agent review). The shared task list prevents duplicate work; the messaging channel enables handoffs.

Agents run within the same OpenCode session context. Each has its own context window but shares the task list. The orchestrator (you) creates the task list, dispatches the team, monitors progress, and integrates results.

State: .opencode/state/orchestration/team-{session}/ holds the shared task list and message log.

## Gatekeeping Question

Before dispatching, ask (passing the flag skips the question — non-interactive path):

> **Question — team size?**
> 1. 2 agents
> 2. 3 agents (common default)
> 3. 4 agents
> 4. 5 agents
> (or type your own number)

Resolved answer maps to \`--agents=N\`.`,

  tools: ["taskTodos", "listAgents", "modeState", "bash"],
  relatedSkills: [],

  examples: [
    {
      input: "/orchestrate-hub team",
      approach: "Asks team size (picks 3). Orchestrator then creates 3 tasks (one per resource). 3 agents each claim a task, implement it, mark complete. Orchestrator verifies all three, runs integration tests."
    },
    {
      input: "/orchestrate-hub team --agents=3 'implement CRUD for users, posts, and comments'",
      approach: "Flag passed → gate skipped. Same as above with an explicit team size."
    }
  ]
}

export default spec
