import { HubSubcommandSpec } from "../../hub-data"
import { TOOLS_RUNTIME } from "../shared-spec-fragments"

const spec: HubSubcommandSpec = {
  label: "token-use-savings",
  description: "Dollar and token savings from mechanical alternatives",
  reminder: "Report token and dollar savings.",
  inline: true,
  detailedDescription: `Report measured savings. Call the \`runtime\` tool with action \`savings\` and relay: sessions counted, dollars spent, and the savings ledger (compression, decision extraction, mechanical alternatives) with token and cost totals.

Only report measured numbers. Do not estimate savings that were not logged.`,
  tools: TOOLS_RUNTIME,
}

export default spec
