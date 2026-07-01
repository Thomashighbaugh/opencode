import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "top-down",
  description: "Decompose from high-level vision into components and sub-systems",
  reminder: "Decompose vision into components top-down.",
  inline: true,

  detailedDescription: `Top-down decomposition: starts from a high-level vision and breaks it into components, then sub-components, down to implementable units.

Vision → System → Subsystems → Modules → Units

Each level is a decomposition of the level above. The top-down approach ensures the architecture serves the vision, not the other way around. It's best when the vision is clear but the implementation path isn't.

Contrast with /ideation bottom-up (compose from primitives). Use top-down when you have a clear end-state vision and need to figure out the components.`,

  tools: ["bash", "taskTodos"],
  relatedSkills: [],
}

export default spec