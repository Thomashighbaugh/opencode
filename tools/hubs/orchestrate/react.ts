import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "react",
  description: "ReAct pattern — interleaved Reasoning and Acting: think → act → observe → reason → repeat until goal met",
  reminder: "ReAct loop: think, act, observe, repeat.",
  inline: true,

  detailedDescription: `Implements the ReAct (Reasoning + Acting) pattern. Each cycle:

1. Reason: the agent reasons about the current state and what to do next (produces a thought).
2. Act: the agent takes an action (runs a tool, edits a file, dispatches a subagent).
3. Observe: the agent observes the action's output.
4. Repeat until the goal is met or a stopping condition triggers.

Unlike ralph (which loops a verify-execute cycle), ReAct explicitly separates the reasoning step — the thought is a first-class artifact, not just internal. This makes the agent's decision process visible and debuggable.

Use for exploratory tasks where the next action depends on observing the result of the previous one: debugging, investigation, incremental refactoring where you don't know the full path upfront. The reasoning trace is saved to state for post-hoc analysis.`,

  tools: ["listAgents", "modeState", "bash"],
  relatedSkills: [],

  examples: [
    {
      input: "/orchestrate react 'find and fix the memory leak in the worker pool'",
      approach: "Reason: 'likely candidates are event listener leaks or unbounded queues'. Act: grep for addEventListener. Observe: found 12. Reason: 'check if they're removed'. Act: grep for removeEventListener. Observe: only 3. Reason: '9 leaks'. Act: add removals. Observe: tests pass. Done."
    }
  ]
}

export default spec