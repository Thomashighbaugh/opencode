import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "impeccable-delight",
  description: "Add personality, memorable touches (impeccable delight)",
  reminder: "Runs impeccable delight against the target.",
  inline: true,

  detailedDescription: `Runs \`impeccable delight <target>\` via the impeccable skill launcher to add personality and memorable touches to an interface. Pass a target path as the argument. See reference/delight.md in skills/impeccable/reference/.`,

  tools: ["read", "bash", "agentContext"],
  rules: ["antislop", "antislop-liveliness", "file-operations"],
  relatedSkills: ["impeccable"],
}

export default spec
