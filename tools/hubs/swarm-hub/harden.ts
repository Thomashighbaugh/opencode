import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "harden",
  description: "Composable robustness — safeTask (error+deviation tracking), circuitBreaker (halt on failure rate), verificationGate (block downstream until verified)",
  reminder: "Wrap workflow with robustness composables.",
  skill: "harden",

  detailedDescription: `Composable robustness wrappers that can be applied to any other orchestration pattern:

- safeTask: wraps a task with error tracking and deviation detection. If the task's output deviates from expectations (e.g. produced no changes, changed unrelated files), it's flagged.
- circuitBreaker: monitors a workflow's failure rate. If failures exceed a threshold (e.g. 3 failures in 5 attempts), the circuit "trips" and halts the workflow to prevent cascading failures.
- verificationGate: blocks downstream tasks from running until the upstream task is verified. Unlike a simple "run tests after", the gate holds the pipeline — nothing proceeds until verification passes.

These are composable — you can wrap any pattern with any combination. E.g. "ralph with a circuitBreaker and verificationGate" gives you a persistent loop that halts if it's failing too often and won't proceed past unverified work.

Use when you need to harden an existing orchestration pattern against failures, flakiness, or runaway loops.`,

  tools: ["loadSkill", "bash", "modeState"],
  relatedSkills: [],

  examples: [
    {
      input: "/orchestrate harden --wrap=ralph --circuit-breaker='3/5' --gate='npm test' 'fix all type errors'",
      approach: "Ralph loops fixing type errors. CircuitBreaker: if 3 of 5 attempts fail, halt (something is systematically wrong). verificationGate: each fix must pass 'npm test' before the next iteration."
    }
  ]
}

export default spec