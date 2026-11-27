import { HubSubcommandSpec } from "../../hub-data"
import { TOOLS_RUNTIME } from "../shared-spec-fragments"

const spec: HubSubcommandSpec = {
  label: "runtime-flags",
  description: "List runtime feature flags and their current values",
  reminder: "Show runtime feature flags.",
  inline: true,
  detailedDescription: `List the runtime feature flags and whether each is on. Call the \`runtime\` tool with action \`config\` and relay the table. Flags cover prompt precision, anti-duplication, single-concern, quick routing, pre-computation, mechanical alternatives, project-tool promotion, memory, and keep-warm.

Flag changes are environment variables, not repo edits: report the variable name so the user sets it in their shell or project env.`,
  tools: TOOLS_RUNTIME,
}

export default spec
