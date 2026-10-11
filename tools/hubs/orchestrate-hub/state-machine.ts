import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_LISTAGENTS_MODESTATE_BASH } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "state-machine",
  description: "Agents as states, with explicit transitions and guards",
  reminder: "Model workflow as state machine. Asks: workflow definition.",
  inline: true,

  detailedDescription: `Models the workflow as an explicit state machine where each state is an agent invocation and transitions are guarded by output conditions. The orchestrator maintains current state, dispatches the state's agent, evaluates the agent's output against transition guards, and moves to the next state.

Unlike ralph's simple loop, this pattern handles workflows with branching logic: different outputs route to different states. Each transition can have a guard (e.g. "only proceed to 'deploy' if 'tests pass' AND 'review approved'").

State machine definition format (provided inline in the prompt or via a JSON file):
{
  "initial": "analyze",
  "states": {
    "analyze": { "agent": "@analyst", "transitions": { "ready": "plan", "blocked": "interview" } },
    "plan": { "agent": "@planner", "transitions": { "approved": "implement", "rejected": "analyze" } },
    "implement": { "agent": "@executor", "transitions": { "done": "verify" } },
    "verify": { "agent": "@verifier", "transitions": { "pass": "deploy", "fail": "implement" } },
    "deploy": { "agent": "@executor", "transitions": { "done": "complete" } }
  }
}

Use when the workflow has clear states with conditional transitions — NOT for linear "do A then B then C" flows (use plan-execute for those).

## Gatekeeping Question

Before dispatching, ask (passing the flag skips the question — non-interactive path):

> **Question — workflow definition?**
> 1. Select an existing *.json workflow from the repo (list \`.opencode/state/\` + project config dirs)
> 2. Define one inline in the prompt
> (or type a file path)

Resolved answer maps to \`--definition=<file>\`.`,

  tools: TOOLS_LISTAGENTS_MODESTATE_BASH,
  relatedSkills: [],

  examples: [
    {
      input: "/orchestrate-hub state-machine",
      approach: "Asks for the workflow definition (selects auth-workflow.json). Load the state machine JSON. Dispatch @analyst (state 'analyze'). If output says 'ready', transition to 'plan'; if 'blocked', go to 'interview'. Continue until terminal state."
    },
    {
      input: "/orchestrate-hub state-machine --definition=auth-workflow.json",
      approach: "Flag passed → gate skipped. Same as above with the definition supplied directly."
    }
  ]
}

export default spec
