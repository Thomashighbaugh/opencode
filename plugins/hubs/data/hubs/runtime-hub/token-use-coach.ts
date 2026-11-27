import { HubSubcommandSpec } from "../../hub-data"
import { TOOLS_RUNTIME } from "../shared-spec-fragments"

const spec: HubSubcommandSpec = {
  label: "token-use-coach",
  description: "30-day token and fill trends with specific fixes",
  reminder: "Trend analysis with fixes.",
  inline: true,
  detailedDescription: `Analyze 30-day trends. Call the \`runtime\` tool with action \`coach\` and relay the trend report: fill trajectory, request efficiency, resource health, and the specific fixes it recommends.

Present the top three fixes in priority order; skip anything the data does not support.`,
  tools: TOOLS_RUNTIME,
}

export default spec
