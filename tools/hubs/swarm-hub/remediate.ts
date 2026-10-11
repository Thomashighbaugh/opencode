import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "remediate",
  description: "Watch CI, diagnose the cause, fix, re-run until green",
  reminder: "Auto-remediate build failures until green. Asks: CI command + max iterations.",
  inline: true,

  detailedDescription: `Automated CI/build failure remediation loop:

1. Monitor: fetch the latest CI/build failure log (via gh CLI, Jenkins API, or a local command output).
2. Analyze: parse the failure, classify it (compile error, test failure, lint, dependency issue, flaky test), and identify the root cause.
3. Fix: apply the minimal fix that addresses the root cause. Avoid shotgun fixes — one root cause, one targeted fix.
4. Re-run: trigger the CI/build again. If green, done. If still failing, loop back to step 1 with the new failure.

Bounded by a max-iterations cap to prevent infinite loops on unfixable failures (e.g. infrastructure issues, missing credentials). When the cap is hit, escalate to the user with the failure taxonomy and attempted fixes.

Use when a CI pipeline is failing and you want the agent to grind through fixes autonomously. NOT for failures that require human judgment (product decisions, ambiguous requirements).

## Gatekeeping Question

Before starting, ask (passing the flags skips the question — non-interactive path):

> **Question 1 — CI failure command?** — the command whose output shows the failing log
> 1. gh run view --log-failed
> 2. Type your own (e.g. "make ci", "npm run ci")
>
> **Question 2 — max iterations?**
> 1. 3
> 2. 5 (default)
> 3. 10
> (or type your own number)

Resolved answers map to \`--ci="..."\` and \`--max-iter=N\`.`,

  tools: ["bash", "modeState", "taskTodos"],
  relatedSkills: ["systematic-debugging"],

  examples: [
    {
      input: "/swarm-hub remediate",
      approach: "Asks CI command (gh run view --log-failed) and max iterations (5). Fetch failing log. Analyze: 'TypeError in auth.test.ts:42'. Fix: correct the type. Re-run CI. Still failing? New error: 'missing env var'. Fix: add to CI config. Re-run. Green. Done."
    }
  ]
}

export default spec
