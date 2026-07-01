import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "ralph",
  description: "Persistent loop — keeps working until task is verified complete",
  reminder: "Persistent loop until verified complete.",
  skill: "ralph",

  detailedDescription: `Self-referential execution loop that persists until a configurable verifier confirms task completion. The agent repeatedly: (1) assesses remaining work against the goal, (2) executes the next highest-value step, (3) runs a verification check, (4) if not complete, loops back to step 1.

Use when you have a clear, verifiable end-state and want the agent to grind through multi-step work autonomously without manual "continue?" prompts between iterations. The loop is bounded by the verification gate — it stops the moment the verifier returns "complete", not when the agent feels done.

State is persisted to .opencode/state/orchestration/ so an interrupted ralph session can resume from the last checkpoint. Configure the verifier via flags (e.g. --verifier=@verifier, --goal="all tests pass").

Key behaviors:
- Each iteration produces concrete progress (file changes, test runs, etc.) — never just narration
- Self-verifies against the stated goal before claiming completion
- If stuck after N iterations with no progress, escalates rather than loops infinitely
- Checkpoints written every iteration so resume is lossless`,

  tools: ["loadSkill", "modeState", "taskTodos", "bash"],
  rules: ["completion-guardrail"],
  relatedSkills: ["verify"],

  examples: [
    {
      input: "/orchestrate ralph --goal='make all tests pass in src/auth/'",
      approach: "Agent loops: run tests → see failures → fix code → run tests again. Stops when a full test run is green. Each iteration writes a checkpoint."
    },
    {
      input: "/orchestrate ralph --verifier=@qa-tester 'implement the login form per spec.md'",
      approach: "Agent implements incrementally, then dispatches @qa-tester each iteration to verify. Loops until @qa-tester returns 'complete'."
    }
  ],

  warnings: [
    "Each iteration is an API request — long tasks can consume many requests. Set a max-iterations flag if cost-sensitive."
  ]
}

export default spec