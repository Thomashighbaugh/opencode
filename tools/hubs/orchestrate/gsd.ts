import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "gsd",
  description: "Get Shit Done pipeline — discuss → plan → execute → verify → ship with wave-based parallel execution, fresh context per task, and atomic commits",
  reminder: "Discuss→plan→execute→verify→ship pipeline.",
  inline: true,

  detailedDescription: `"Get Shit Done" pipeline with five phases and wave-based parallel execution:

1. Discuss: clarify the task with the user (if ambiguous). Produce a shared understanding of the goal.
2. Plan: decompose the goal into a task tree. Tasks are grouped into waves — tasks in the same wave are independent and can run in parallel.
3. Execute: dispatch waves sequentially. Within a wave, tasks run in parallel as subagents. Each subagent gets fresh context (no cross-contamination) and makes an atomic git commit when its task completes.
4. Verify: after all waves complete, run the full verification suite (tests, lint, build). If anything fails, the responsible task's commit is identified and the fix loops.
5. Ship: tag, changelog, and release if all verification passes.

The wave-based design means parallelism is maximized (tasks in a wave run concurrently) but dependencies are respected (a wave only starts after its predecessor completes and verifies).

Use for medium-to-large features that benefit from parallel execution with a clear ship-ready end state. Each task's atomic commit makes rollback granular.`,

  tools: ["bash", "listAgents", "taskTodos", "modeState"],
  rules: ["completion-guardrail"],

  examples: [
    {
      input: "/orchestrate gsd 'add user profile pages: avatar upload, bio editor, settings panel'",
      approach: "Plan: Wave 1 [avatar, bio, settings] (parallel). Wave 2 [profile page integrating all three]. Execute Wave 1 (3 parallel subagents, each commits). Execute Wave 2. Verify: full test suite. Ship: tag v1.x."
    }
  ]
}

export default spec