import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "pt-review",
  description: "Review current diff for over-engineering",
  reminder: "Reviewing diff for over-engineering.",
  inline: true,
  detailedDescription: "Reviews the current diff against Ponytail principles, flags over-engineering, returns delete-list.",
}

export default spec
