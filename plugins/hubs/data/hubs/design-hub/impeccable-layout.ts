import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "impeccable-layout",
  description: "Fix spacing, rhythm, visual hierarchy (impeccable layout)",
  reminder: "Runs impeccable layout against the target.",
  inline: true,

  detailedDescription: `Runs \`impeccable layout <target>\` via the impeccable skill launcher to fix spacing, rhythm, and visual hierarchy. Pass a target path as the argument. See reference/layout.md in skills/impeccable/reference/.`,

  tools: ["read", "bash", "agentContext"],
  rules: ["antislop", "antislop-liveliness", "file-operations"],
  relatedSkills: ["impeccable"],
}

export default spec
