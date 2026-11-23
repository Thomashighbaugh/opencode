import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "impeccable-craft",
  description: "Ordinary new-work build (impeccable craft, deprecated)",
  reminder: "Runs impeccable craft — deprecated alias for ordinary new-work.",
  inline: true,

  detailedDescription: "Runs `impeccable craft <feature>` via the impeccable skill launcher. craft is a deprecated alias for an ordinary new-work build request — it adds nothing beyond what `impeccable shape` + `impeccable new-work` already do. Pass a feature description as the argument. See reference/craft.md in skills/impeccable/reference/.",

  tools: ["read", "bash", "agentContext"],
  rules: ["file-operations", "writing-style"],
  relatedSkills: ["impeccable"],
}

export default spec
