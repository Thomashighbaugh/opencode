import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "impeccable-quieter",
  description: "Tone down loud designs (impeccable quieter)",
  reminder: "Runs impeccable quieter against the target.",
  inline: true,

  detailedDescription: `Runs \`impeccable quieter <target>\` via the impeccable skill launcher to tone down aggressive or overstimulating designs. Pass a target path as the argument. See reference/quieter.md in skills/impeccable/reference/.`,

  tools: ["read", "bash", "agentContext"],
  rules: ["antislop", "antislop-liveliness", "file-operations"],
  relatedSkills: ["impeccable"],
}

export default spec
