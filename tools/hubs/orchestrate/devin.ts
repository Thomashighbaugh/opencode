import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "devin",
  description: "Autonomous Plan→Code→Debug→Deploy pipeline with iterative debugging cycles and root-cause analysis loops",
  reminder: "Plan→Code→Debug→Deploy pipeline.",
  inline: true,

  detailedDescription: `Four-phase autonomous pipeline inspired by Devin-style agentic coding:

1. Plan: produce a complete implementation plan from the task description. The plan is explicit and saved.
2. Code: implement the plan step by step. Each step produces concrete code.
3. Debug: if any step's output fails verification, enter a debugging sub-loop. The debugger investigates root cause (using systematic debugging), fixes it, and re-verifies. The sub-loop is bounded — if root cause can't be found in N attempts, escalate.
4. Deploy: once all steps pass verification, deploy (if a deploy target is configured).

The distinguishing feature is the Debug sub-loop: rather than just "try again", it does root-cause analysis first. This prevents fix-attempt cycles that treat symptoms rather than causes.

Use for end-to-end feature delivery where you expect bugs during implementation and want autonomous root-cause debugging rather than blind retries.`,

  tools: ["bash", "listAgents", "modeState", "taskTodos"],
  rules: ["completion-guardrail"],
  relatedSkills: ["systematic-debugging", "verify"],

  examples: [
    {
      input: "/orchestrate devin --deploy='npm run deploy' 'add WebSocket support to the chat server'",
      approach: "Plan: add WS server, client adapter, message handler, reconnection logic. Code: implement each. Debug: tests fail on reconnection — root cause is race condition in close handler. Fix. Re-verify: pass. Deploy."
    }
  ]
}

export default spec