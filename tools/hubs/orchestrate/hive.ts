import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "hive",
  description: "Agent Hive execution — Swarm Bee phase: batched parallelism with worktree isolation, best-effort worker verification, blocked worker protocol, orchestrator batch testing",
  reminder: "Swarm Bee: batched parallel execution.",
  skill: "hive-methodology",

  detailedDescription: `Agent Hive "Swarm Bee" execution phase. Features:

- Worktree isolation: each worker gets its own git worktree so parallel work doesn't conflict on the same files. Workers commit to their own branch.
- Batched parallelism: workers are dispatched in batches; the orchestrator tests the integrated result after each batch (not per-worker).
- Best-effort worker verification: each worker self-verifies, but the orchestrator runs the authoritative integration test after merging a batch.
- Blocked worker protocol: if a worker hits a blocker, it marks itself blocked rather than spinning. The orchestrator can unblock or reassign.

This is the execution half of the Hive methodology (the planning half is /ideation hive, the "Architect Bee" phase). After /ideation hive produces plan.md and the user approves, /orchestrate hive executes it.

Use for large parallelizable features where file conflicts are a real risk. Worktree isolation makes parallel work safe.`,

  tools: ["loadSkill", "listAgents", "modeState", "taskTodos", "bash"],
  rules: ["completion-guardrail"],
  relatedSkills: [],

  examples: [
    {
      input: "/orchestrate hive --plan=.opencode/state/ideation/plan.md",
      approach: "Read the approved plan. Create worktrees per task batch. Dispatch workers in parallel. After each batch: merge branches, run integration tests. If fail, fix or roll back. Proceed to next batch."
    }
  ],

  warnings: [
    "Worktree creation requires git and disk space. Each worker branch consumes disk until merged and cleaned up."
  ]
}

export default spec