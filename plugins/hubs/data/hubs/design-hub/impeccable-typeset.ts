import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "impeccable-typeset",
  description: "Improve typography hierarchy and fonts (impeccable typeset)",
  reminder: "Runs impeccable typeset against the target.",
  inline: true,

  detailedDescription: `Runs \`impeccable typeset <target>\` via the impeccable skill launcher to improve typography hierarchy and font choices. Pass a target path as the argument. See reference/typeset.md in skills/impeccable/reference/.`,

  tools: ["read", "bash", "agentContext"],
  rules: ["antislop", "antislop-liveliness", "file-operations"],
  relatedSkills: ["impeccable"],
}

export default spec
