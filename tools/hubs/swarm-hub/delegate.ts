import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_LOADSKILL_BASH } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "delegate",
  description: "Hand a bounded task to a separate CLI session, then review its diff",
  reminder: "Delegate a bounded coding task to the OpenCode CLI and review its output.",
  skill: "opencode-delegate",

  detailedDescription: `Delegates a bounded coding task to the OpenCode CLI as a background implementer, then reviews its diff and lands it.

The five-step loop (orchestrator owns judgment, OpenCode does the typing):
1. **Write the brief** — self-contained: goal, current state, what to change/leave, the repo's REAL gate commands, report contract. OpenCode sees only the brief + working tree.
2. **Dispatch** — node <skill-dir>/scripts/relay.ts --brief brief.txt --model <provider/model> --cd <repo>. Requires an explicit --model (or --lane) on fresh runs; --read-only for review-only (plan agent); --resume-last for delta briefs; --timeout as watchdog.
3. **Wait** — blocks until result.json is written and process exits; read the tree, not status lines.
4. **Review** — re-run gates yourself, read the diff against the brief, watch for scope creep; never trust the self-report.
5. **Land** — the orchestrator commits (relay never does); delta brief via --resume-last for rework.

Key mechanics: relay defaults to the write-capable build agent with --auto (no permission prompts in headless runs); plan runs never get --auto. Workspace stays clean — artifacts go to a temp dir. Model choice is the human's (flat-rate subscriptions) — if no usable set is stated in AGENTS.md, ask the user rather than guessing from the metered catalog.

Use when the user wants implementation work handed to OpenCode (or a queue of tasks) while they stay the reviewer. NOT for inline-size tasks or when the user wants direct implementation.`,
  tools: TOOLS_LOADSKILL_BASH,
  relatedSkills: ["verify"],
  examples: [
    {
      input: "/project delegate \"rename X to Y across src/ and update imports\"",
      approach: "Load opencode-delegate skill, check opencode CLI present, write self-contained brief with gate commands, dispatch via relay.ts with a fast model, wait for result.json, re-run gates + read diff, then commit the verified work."
    },
    {
      input: "/project delegate --read-only \"review the auth refactor for security holes\"",
      approach: "Load skill, dispatch with --read-only (plan agent, no --auto), review the returned diagnosis without touching the tree."
    }
  ],
  warnings: [
    "relay.ts requires an explicit --model on fresh runs — a bare `opencode run` errors",
    "Never trust the implementer's gate claims — re-run tests/lint/build yourself",
    "The orchestrator commits; the relay never does"
  ],
}

export default spec
