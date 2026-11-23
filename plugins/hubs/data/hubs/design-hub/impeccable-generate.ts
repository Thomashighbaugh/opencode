import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "impeccable-generate",
  description: "Generate element variants (impeccable generate)",
  reminder: "Runs impeccable generate <n> <action> <element>.",
  inline: true,

  detailedDescription: `Runs \`impeccable generate <n> <action> <element>\` via the impeccable skill launcher to produce variants, versions, or alternatives of a named element to choose from in the live browser, with no manual picking. See reference/generate.md in skills/impeccable/reference/.`,

  tools: ["read", "bash", "agentContext"],
  rules: ["file-operations"],
  relatedSkills: ["impeccable"],
}

export default spec
