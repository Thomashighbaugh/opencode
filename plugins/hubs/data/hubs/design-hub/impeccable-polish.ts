import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "impeccable-polish",
  description: "Final quality pass before shipping (impeccable polish)",
  reminder: "Runs impeccable polish against the target.",
  inline: true,

  detailedDescription: `Runs \`impeccable polish <target>\` via the impeccable skill launcher for the final quality pass before shipping. Pass a target path as the argument. Runs after all other design work is complete. See reference/polish.md in skills/impeccable/reference/.`,

  tools: ["read", "bash", "agentContext"],
  rules: ["antislop", "antislop-liveliness", "file-operations"],
  relatedSkills: ["impeccable"],
}

export default spec
