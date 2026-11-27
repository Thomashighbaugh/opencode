import { HubSubcommandSpec } from "../../hub-data"
import { TOOLS_RUNTIME } from "../shared-spec-fragments"

const spec: HubSubcommandSpec = {
  label: "runtime-status",
  description: "Live context health, fill %, tool count, quality grade",
  reminder: "Report runtime status for this session.",
  inline: true,
  detailedDescription: `Report the current session's runtime status. Call the \`runtime\` tool with action \`status\` and relay its output: quality score and grade, resource health, fill percent, tool calls, requests, tokens per request, efficiency, and any fill, tool-count, or regime warnings.

This is a status read, not a fix. Use token-use-audit for a guided audit and token-use-report for a per-component breakdown.`,
  tools: TOOLS_RUNTIME,
  relatedSkills: ["vectorize-context"],
}

export default spec
