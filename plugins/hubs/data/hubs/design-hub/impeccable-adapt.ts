import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "impeccable-adapt",
  description: "Adapt for devices and screen sizes (impeccable adapt)",
  reminder: "Runs impeccable adapt against the target.",
  inline: true,

  detailedDescription: `Runs \`impeccable adapt <target>\` via the impeccable skill launcher to adapt a design for different devices and screen sizes (responsive behavior). Pass a target path as the argument. See reference/adapt.md in skills/impeccable/reference/.`,

  tools: ["read", "bash", "agentContext"],
  rules: ["antislop", "antislop-liveliness", "file-operations"],
  relatedSkills: ["impeccable"],
}

export default spec
