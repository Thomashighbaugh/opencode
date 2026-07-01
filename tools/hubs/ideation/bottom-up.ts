import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "bottom-up",
  description: "Build up from existing primitives and capabilities into composed systems",
  reminder: "Compose systems from existing primitives.",
  inline: true,

  detailedDescription: `Bottom-up composition: starts from existing primitives, capabilities, and building blocks, then composes them into larger systems.

Units → Modules → Subsystems → System

Each level composes elements from the level below. The bottom-up approach is best when you have strong existing components and want to figure out what you can build with them. It's grounded in what exists rather than what's envisioned.

Contrast with /ideation top-down (decompose from vision). Use bottom-up when you have capable building blocks and want to discover what system they can form.`,

  tools: ["bash", "taskTodos"],
  relatedSkills: [],
}

export default spec