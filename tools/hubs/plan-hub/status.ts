import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_BASH } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "status",
  description: "Show current ideation state",
  reminder: "Show ideation state.",
  inline: true,

  detailedDescription: `Shows the current state of the ideation hub: work products, checkpoints, state files, and modification times. Read-only.`,

  tools: TOOLS_BASH,
  relatedSkills: [],
}

export default spec