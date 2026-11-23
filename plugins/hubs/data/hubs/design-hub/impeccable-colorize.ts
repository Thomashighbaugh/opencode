import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "impeccable-colorize",
  description: "Add strategic color to monochrome UIs (impeccable colorize)",
  reminder: "Runs impeccable colorize against the target.",
  inline: true,

  detailedDescription: `Runs \`impeccable colorize <target>\` via the impeccable skill launcher to add strategic color to monochromatic UIs. Pass a target path as the argument. See reference/colorize.md in skills/impeccable/reference/.`,

  tools: ["read", "bash", "agentContext"],
  rules: ["antislop", "antislop-liveliness", "file-operations"],
  relatedSkills: ["impeccable"],
}

export default spec
