import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_BASH_TASKTODOS, SKILLS_PLANNING_BREAKDOWN } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "decomposition",
  description: "Break complex work into ordered, verifiable subtasks",
  reminder: "Break complex tasks into actionable subtasks.",
  inline: true,

  detailedDescription: `Decomposes a complex task into an ordered list of actionable subtasks. Unlike /ideation plan (which includes an interview), decomposition assumes the goal is already clear and just breaks it down.

Each subtask has:
- A one-line objective
- Verifiable completion criteria
- Dependencies on prior subtasks (ordered)

The decomposition produces a flat or tree-structured task list. The output is ready to feed into /orchestrate plan-execute, /orchestrate ralph (with the task list as the goal), or /orchestrate subagent-driven.

Use when you have a clear task and need to break it into implementable pieces. For tasks that need clarification first, use /ideation plan.`,

  tools: TOOLS_BASH_TASKTODOS,
  relatedSkills: SKILLS_PLANNING_BREAKDOWN,
}

export default spec