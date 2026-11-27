import { HubSubcommandSpec } from "../../hub-data"
import { TOOLS_RUNTIME } from "../shared-spec-fragments"

const spec: HubSubcommandSpec = {
  label: "token-use-audit",
  description: "Context efficiency audit with guided fixes",
  reminder: "Audit token use and surface fixes.",
  inline: true,
  detailedDescription: `Audit how the current session is spending context. Call the \`runtime\` tool with action \`audit\` and relay the findings: quality score, fill percent, request efficiency, and the specific fixes it proposes.

This is session efficiency, not code health (verify-hub audit) or context structure (knowledge-hub context-audit). Apply the low-risk fixes directly; report the rest for approval.`,
  tools: TOOLS_RUNTIME,
}

export default spec
