import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "pt-audit",
  description: "Audit whole repo for over-engineering",
  reminder: "Auditing repo for over-engineering.",
  inline: true,
  detailedDescription: "Audits entire repository for over-engineering, returning a structured audit report.",
}

export default spec
