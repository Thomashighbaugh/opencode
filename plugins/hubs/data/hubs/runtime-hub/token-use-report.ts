import { HubSubcommandSpec } from "../../hub-data"
import { TOOLS_RUNTIME } from "../shared-spec-fragments"

const spec: HubSubcommandSpec = {
  label: "token-use-report",
  description: "Per-component token breakdown for the session",
  reminder: "Break down token use by component.",
  inline: true,
  detailedDescription: `Break token use down by component. Call the \`runtime\` tool with action \`report\` and relay: stale reads, bloated results, decision density, agent efficiency, and absolute waste. Name the largest contributor first and give one concrete reduction.`,
  tools: TOOLS_RUNTIME,
}

export default spec
