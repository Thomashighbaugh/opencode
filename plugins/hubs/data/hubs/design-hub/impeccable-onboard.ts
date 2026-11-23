import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "impeccable-onboard",
  description: "Design first-run flows, empty states (impeccable onboard)",
  reminder: "Runs impeccable onboard against the target.",
  inline: true,

  detailedDescription: `Runs \`impeccable onboard <target>\` via the impeccable skill launcher to design first-run flows, empty states, and activation experiences. Pass a target path as the argument. See reference/onboard.md in skills/impeccable/reference/.`,

  tools: ["read", "bash", "agentContext"],
  rules: ["antislop", "antislop-liveliness", "file-operations"],
  relatedSkills: ["impeccable"],
}

export default spec
