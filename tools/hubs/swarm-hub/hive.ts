import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_LOADSKILL_LISTAGENTS_MODESTATE_TASKTODOS_BASH } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "hive",
  description: "Batched parallel workers with worktree isolation and blocked-worker protocol",
  reminder: "Swarm Bee: batched parallel execution. Asks: which plan to execute.",
  skill: "hive-methodology",

  detailedDescription: `Agent Hive "Swarm Bee" execution phase. Features:

- Worktree isolation: each worker gets its own git worktree so parallel work doesn't conflict on the same files. Workers commit to their own branch.
- Batched parallelism: workers are dispatched in batches; the orchestrator tests the integrated result after each batch (not per-worker).
- Best-effort worker verification: each worker self-verifies, but the orchestrator runs the authoritative integration test after merging a batch.
- Blocked worker protocol: if a worker hits a blocker, it marks itself blocked rather than spinning. The orchestrator can unblock or reassign.

This is the execution half of the Hive methodology (the planning half is /swarm-hub hive-plan, the "Architect Bee" phase). After /swarm-hub hive-plan produces plan.md and the user approves, /swarm-hub hive executes it.

Use for large parallelizable features where file conflicts are a real risk. Worktree isolation makes parallel work safe.

## Gatekeeping Question

Before executing, ask (passing the flag skips the question — non-interactive path):

> **Question — which plan to execute?**
> 1. Select an approved plan — list .opencode/state/ideation/*.md
> 2. Type a topic — run /swarm-hub hive-plan first to produce the plan
> (or type a path)

Resolved answer maps to \`--plan=<file>\`.`,

  tools: TOOLS_LOADSKILL_LISTAGENTS_MODESTATE_TASKTODOS_BASH,
  relatedSkills: [],

  examples: [
    {
      input: "/swarm-hub hive",
      approach: "Asks which plan (selects .opencode/state/ideation/plan.md). Read the approved plan. Create worktrees per task batch. Dispatch workers in parallel. After each batch: merge branches, run integration tests. If fail, fix or roll back. Proceed to next batch."
    },
    {
      input: "/swarm-hub hive --plan=.opencode/state/ideation/plan.md",
      approach: "Flag passed → gate skipped. Same execution flow with the plan supplied directly."
    }
  ],

  warnings: [
    "Worktree creation requires git and disk space. Each worker branch consumes disk until merged and cleaned up."
  ]
}

export default spec
