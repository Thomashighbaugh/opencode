import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "impeccable-shape",
  description: "Plan UX/UI before code (impeccable shape)",
  reminder: "Runs impeccable shape against the target.",
  inline: true,

  detailedDescription: `Runs \`impeccable shape <target>\` via the impeccable skill launcher to plan UX/UI before writing code. Pass a target path or route as the argument. Reads PRODUCT.md and DESIGN.md (via \`impeccable context\`) before shaping. Writes a surface brief for the target. See reference/shape.md in skills/impeccable/reference/.`,

  tools: ["read", "bash", "agentContext"],
  rules: ["file-operations", "writing-style"],
  relatedSkills: ["impeccable"],
}

export default spec
