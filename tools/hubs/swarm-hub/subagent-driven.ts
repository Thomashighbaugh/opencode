import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_LOADSKILL_LISTAGENTS_MODESTATE_TASKTODOS_BASH, SKILLS_VERIFY } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "subagent-driven",
  description: "One fresh subagent per task, with review gates after each",
  reminder: "Dispatch subagents per task with automated review gates. Asks: which plan.",
  skill: "subagent-driven-development",

  detailedDescription: `Subagent-driven development pattern: each task in an implementation plan is executed by a FRESH subagent (no context carry-over between tasks), with automated review gates after each task.

Per-task flow:
1. Dispatch a fresh @executor subagent with the task spec + relevant context (files, rules).
2. Subagent implements the task and self-verifies.
3. Automated review gate: @code-reviewer reviews the subagent's output for spec compliance and code quality.
4. If review passes, proceed to next task. If review fails, the same task is re-dispatched with the review feedback.

After all tasks: a broad final review covers cross-task integration, not just per-task correctness.

Hub-to-hub handoff protocol: this pattern includes a bridge protocol for passing plans from /ideate-hub → /orchestrate-hub → /memory-hub. The plan document is the handoff artifact — it survives context switches because it's on disk, not in a context window.

Use for executing plans produced by /ideate-hub (plan, ralplan, decomposition, etc.) where you want per-task isolation + automated review. The fresh-context-per-task design prevents earlier tasks' mistakes from contaminating later tasks' context.

## Gatekeeping Question

Before dispatching, ask (passing the flag skips the question — non-interactive path):

> **Question — which plan to execute?**
> 1. Select an approved plan — list .opencode/state/ideation/*.md
> 2. Type a topic — describe the work and generate the plan first
> (or type a path)

Resolved answer maps to \`--plan=<file>\`.`,

  tools: TOOLS_LOADSKILL_LISTAGENTS_MODESTATE_TASKTODOS_BASH,
  relatedSkills: SKILLS_VERIFY,

  examples: [
    {
      input: "/swarm-hub subagent-driven",
      approach: "Asks which plan (selects .opencode/state/ideation/plan.md). Read plan (5 tasks). Task 1: fresh @executor implements, @code-reviewer reviews → pass. Task 2: fresh @executor (doesn't know about task 1's mistakes), implements, reviewed → pass. ... Final: broad review of all 5 tasks together."
    }
  ]
}

export default spec
