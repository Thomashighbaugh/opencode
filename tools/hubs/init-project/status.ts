import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_BASH } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "status",
  description: "Show current initialization state and checkpoint progress",
  reminder: "Show init state and checkpoint progress.",
  inline: true,

  detailedDescription: `Shows the current init-project state: which phases have completed, the current checkpoint, and any errors from the last run. Read-only.

Use to check progress of a setup run, especially after an interruption.`,

  tools: TOOLS_BASH,
  relatedSkills: [],
}

export default spec