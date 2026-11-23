import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "impeccable-critique",
  description: "Scored UX design review (impeccable critique)",
  reminder: "Runs impeccable critique against the target.",
  inline: true,

  detailedDescription: `Runs \`impeccable critique <target>\` via the impeccable skill launcher to perform a scored UX design review of a page, component, or flow. Pass a target path as the argument. Produces ranked findings. See reference/critique.md in skills/impeccable/reference/.`,

  tools: ["read", "bash", "agentContext"],
  rules: ["antislop", "antislop-liveliness", "file-operations"],
  relatedSkills: ["impeccable"],
}

export default spec
