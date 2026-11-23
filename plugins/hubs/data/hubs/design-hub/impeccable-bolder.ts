import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "impeccable-bolder",
  description: "Amplify safe or bland designs (impeccable bolder)",
  reminder: "Runs impeccable bolder against the target.",
  inline: true,

  detailedDescription: `Runs \`impeccable bolder <target>\` via the impeccable skill launcher to amplify safe or bland designs with a distinct point of view. Pass a target path as the argument. See reference/bolder.md in skills/impeccable/reference/.`,

  tools: ["read", "bash", "agentContext"],
  rules: ["antislop", "antislop-liveliness", "file-operations"],
  relatedSkills: ["impeccable"],
}

export default spec
