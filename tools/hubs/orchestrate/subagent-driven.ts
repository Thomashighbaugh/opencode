import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "subagent-driven",
  description: "Execute implementation plans via fresh subagent per task with automated review gates — spec compliance + code quality after each task, broad final review. Includes hub-to-hub handoff protocol for bridging ideation→orchestrate→harvest-context",
  reminder: "Dispatch subagents per task with automated review gates.",
  skill: "subagent-driven-development",

  detailedDescription: `Subagent-driven development pattern: each task in an implementation plan is executed by a FRESH subagent (no context carry-over between tasks), with automated review gates after each task.

Per-task flow:
1. Dispatch a fresh @executor subagent with the task spec + relevant context (files, rules).
2. Subagent implements the task and self-verifies.
3. Automated review gate: @code-reviewer reviews the subagent's output for spec compliance and code quality.
4. If review passes, proceed to next task. If review fails, the same task is re-dispatched with the review feedback.

After all tasks: a broad final review covers cross-task integration, not just per-task correctness.

Hub-to-hub handoff protocol: this pattern includes a bridge protocol for passing plans from /ideation → /orchestrate → /harvest-context. The plan document is the handoff artifact — it survives context switches because it's on disk, not in a context window.

Use for executing plans produced by /ideation (plan, ralplan, decomposition, etc.) where you want per-task isolation + automated review. The fresh-context-per-task design prevents earlier tasks' mistakes from contaminating later tasks' context.`,

  tools: ["loadSkill", "listAgents", "taskTodos", "modeState", "bash"],
  rules: ["completion-guardrail"],
  relatedSkills: ["verify"],

  examples: [
    {
      input: "/orchestrate subagent-driven --plan=.opencode/state/ideation/plan.md",
      approach: "Read plan (5 tasks). Task 1: fresh @executor implements, @code-reviewer reviews → pass. Task 2: fresh @executor (doesn't know about task 1's mistakes), implements, reviewed → pass. ... Final: broad review of all 5 tasks together."
    }
  ]
}

export default spec