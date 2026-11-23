import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "impeccable-extract",
  description: "Pull tokens/components into design system (impeccable extract)",
  reminder: "Runs impeccable extract against the target.",
  inline: true,

  detailedDescription: `Runs \`impeccable extract <target>\` via the impeccable skill launcher to pull repeated patterns into the design system as tokens and components. Pass a target path as the argument. See reference/extract.md in skills/impeccable/reference/.`,

  tools: ["read", "write", "bash", "agentContext"],
  rules: ["file-operations", "writing-style"],
  relatedSkills: ["impeccable"],
}

export default spec
