import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "impeccable-optimize",
  description: "Diagnose and fix UI performance (impeccable optimize)",
  reminder: "Runs impeccable optimize against the target.",
  inline: true,

  detailedDescription: `Runs \`impeccable optimize <target>\` via the impeccable skill launcher to diagnose and fix UI loading and rendering performance. Pass a target path as the argument. See reference/optimize.md in skills/impeccable/reference/.`,

  tools: ["read", "bash", "agentContext"],
  rules: ["antislop", "antislop-liveliness", "file-operations"],
  relatedSkills: ["impeccable"],
}

export default spec
