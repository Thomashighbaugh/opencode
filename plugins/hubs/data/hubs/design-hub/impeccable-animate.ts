import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "impeccable-animate",
  description: "Add purposeful animations (impeccable animate)",
  reminder: "Runs impeccable animate against the target.",
  inline: true,

  detailedDescription: `Runs \`impeccable animate <target>\` via the impeccable skill launcher to add purposeful animations and motion feedback. Pass a target path as the argument. See reference/animate.md in skills/impeccable/reference/.`,

  tools: ["read", "bash", "agentContext"],
  rules: ["antislop", "antislop-liveliness", "file-operations"],
  relatedSkills: ["impeccable"],
}

export default spec
