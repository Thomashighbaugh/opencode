import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "resume",
  description: "Resume last ideation session",
  reminder: "Resume last ideation session.",
  inline: true,

  detailedDescription: `Resumes the most recent ideation session from its work-products. Loads the latest work product from .opencode/state/ideation/work-products/ and continues the ideation from where it left off.

Use when a previous /ideation invocation was interrupted and you want to continue without losing the work product.`,

  tools: ["bash"],
  relatedSkills: [],
}

export default spec