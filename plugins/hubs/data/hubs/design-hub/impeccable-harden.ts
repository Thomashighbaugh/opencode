import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "impeccable-harden",
  description: "Production-ready: errors, i18n, edge cases (impeccable harden)",
  reminder: "Runs impeccable harden against the target.",
  inline: true,

  detailedDescription: `Runs \`impeccable harden <target>\` via the impeccable skill launcher to make a design production-ready: error handling, i18n, overflow, and edge cases. Pass a target path as the argument. See reference/harden.md in skills/impeccable/reference/.`,

  tools: ["read", "bash", "agentContext"],
  rules: ["antislop", "antislop-liveliness", "file-operations"],
  relatedSkills: ["impeccable"],
}

export default spec
