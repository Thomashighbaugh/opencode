import { HubSubcommandSpec } from "../../hub-data"
import { TOOLS_RUNTIME } from "../shared-spec-fragments"

const spec: HubSubcommandSpec = {
  label: "token-use-route",
  description: "Model and effort recommendation before spending tokens",
  reminder: "Recommend model and effort before the next request.",
  inline: true,
  detailedDescription: `Recommend how to route the next request. Call the \`runtime\` tool with action \`route\` and relay the recommendation: model tier and effort (standard, reasoning, high) based on session health and fill.

Apply the recommendation to the next request. Note the reasoning in one line so the choice is auditable.`,
  tools: TOOLS_RUNTIME,
}

export default spec
