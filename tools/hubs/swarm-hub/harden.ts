import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "harden",
  description: "Composable robustness — safe task, circuit breaker, verification gate",
  reminder: "Wrap workflow with robustness composables. Asks: wrap mode + threshold + gate.",
  skill: "harden",

  detailedDescription: `Composable robustness wrappers that can be applied to any other orchestration pattern:

- safeTask: wraps a task with error tracking and deviation detection. If the task's output deviates from expectations (e.g. produced no changes, changed unrelated files), it's flagged.
- circuitBreaker: monitors a workflow's failure rate. If failures exceed a threshold (e.g. 3 failures in 5 attempts), the circuit "trips" and halts the workflow to prevent cascading failures.
- verificationGate: blocks downstream tasks from running until the upstream task is verified. Unlike a simple "run tests after", the gate holds the pipeline — nothing proceeds until verification passes.

These are composable — you can wrap any pattern with any combination. E.g. "ralph with a circuitBreaker and verificationGate" gives you a persistent loop that halts if it's failing too often and won't proceed past unverified work.

Use when you need to harden an existing orchestration pattern against failures, flakiness, or runaway loops.

## Gatekeeping Question

Before wrapping, ask (passing the flags skips the question — non-interactive path):

> **Question 1 — wrap which orchestration pattern?**
> 1. ralph — persistent loop
> 2. autopilot — full autonomous run
> 3. team — coordinated agents
> 4. ultrawork — parallel batch
> (or type your own)
>
> **Question 2 — circuit-breaker threshold?** (default 3/5 = trip after 3 failures in 5 attempts)
> 1. 3/5
> 2. 5/10
> (or type your own \`failures/attempts\`)
>
> **Question 3 — verification-gate command?** — pick a package.json script (or type your own, e.g. "npm test")

Resolved answers map to \`--wrap=...\`, \`--circuit-breaker=...\`, \`--gate="..."\`.`,

  tools: ["loadSkill", "bash", "modeState"],
  relatedSkills: [],

  examples: [
    {
      input: "/swarm-hub harden 'fix all type errors'",
      approach: "Asks wrap mode (ralph), threshold (3/5), and gate command ('npm test'). Ralph loops fixing type errors. CircuitBreaker: if 3 of 5 attempts fail, halt (something is systematically wrong). verificationGate: each fix must pass 'npm test' before the next iteration."
    }
  ]
}

export default spec
