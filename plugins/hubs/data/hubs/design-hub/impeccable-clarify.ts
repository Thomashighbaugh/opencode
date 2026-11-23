import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "impeccable-clarify",
  description: "Improve UX copy, labels, errors (impeccable clarify)",
  reminder: "Runs impeccable clarify against the target.",
  inline: true,

  detailedDescription: `Runs \`impeccable clarify <target>\` via the impeccable skill launcher to improve UX copy, labels, and error messages. Pass a target path as the argument. See reference/clarify.md in skills/impeccable/reference/.`,

  tools: ["read", "bash", "agentContext"],
  rules: ["writing-style", "file-operations"],
  relatedSkills: ["impeccable"],
}

export default spec
