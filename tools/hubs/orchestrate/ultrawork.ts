import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "ultrawork",
  description: "Maximum parallel execution for high-throughput tasks",
  reminder: "Execute all independent tasks in parallel.",
  skill: "ultrawork",

  detailedDescription: `Parallel execution engine for high-throughput task completion. Decomposes work into independent units and dispatches them concurrently as subagents, then aggregates results.

Designed for tasks where the units of work are genuinely independent (no data dependencies between them) and throughput matters more than coordination. Each subagent gets fresh context (no cross-contamination) and a single focused objective.

Use when you have a batch of similar, independent tasks: "write tests for these 12 modules", "fix lint errors across these 30 files", "document these 8 endpoints". NOT for tasks with sequential dependencies — use /orchestrate plan-execute or /orchestrate ralph for those.

Configure concurrency via flags (e.g. --concurrency=5). Default: dispatches as many as practical given the agent budget. Each subagent's output is captured to .opencode/state/orchestration/ultrawork-{session}/.`,

  tools: ["taskTodos", "listAgents", "bash", "modeState"],
  rules: ["completion-guardrail"],

  examples: [
    {
      input: "/orchestrate ultrawork 'write integration tests for each endpoint in src/api/'",
      approach: "Scan src/api/, create one task per endpoint file, dispatch a subagent per task. Each writes tests for its endpoint. Aggregate results, run full suite."
    }
  ],

  warnings: [
    "High API request consumption — each parallel task is a subagent invocation. Cost scales with task count × concurrency."
  ]
}

export default spec