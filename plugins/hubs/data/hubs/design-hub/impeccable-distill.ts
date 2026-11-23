import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "impeccable-distill",
  description: "Strip to essence, remove complexity (impeccable distill)",
  reminder: "Runs impeccable distill against the target.",
  inline: true,

  detailedDescription: `Runs \`impeccable distill <target>\` via the impeccable skill launcher to strip a design to its essence and remove complexity. Pass a target path as the argument. See reference/distill.md in skills/impeccable/reference/.`,

  tools: ["read", "bash", "agentContext"],
  rules: ["antislop", "antislop-liveliness", "file-operations"],
  relatedSkills: ["impeccable"],
}

export default spec
