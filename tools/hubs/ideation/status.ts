import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "status",
  description: "Show current ideation state",
  reminder: "Show ideation state.",
  inline: true,

  detailedDescription: `Shows the current state of the ideation hub: work products, checkpoints, state files, and modification times. Read-only.`,

  tools: ["bash"],
  relatedSkills: [],
}

export default spec