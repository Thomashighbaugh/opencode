import { HubSubcommandSpec } from "../../hub-data"
import { TOOLS_RUNTIME } from "../shared-spec-fragments"

const spec: HubSubcommandSpec = {
  label: "runtime-doctor",
  description: "Runtime installation and health check",
  reminder: "Check runtime installation and health.",
  inline: true,
  detailedDescription: `Check that the runtime engine is healthy. Call the \`runtime\` tool with action \`doctor\` and report: plugin loaded, database reachable, nudge delivery mode, and any broken dependency.

This checks the runtime engine, not the project's opencode.jsonc; that is /hub-setup doctor.`,
  tools: TOOLS_RUNTIME,
}

export default spec
