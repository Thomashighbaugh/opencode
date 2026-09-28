import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "code-review",
  description: "Delegated code review by smell taxonomy — pass instructions directly to the code-smell-review skill",
  reminder: "Reviewing via the code-smell-review skill.",
  skill: "code-smell-review",
  detailedDescription: "Loads the code-smell-review skill directly. The remainder of your prompt is passed as specific review instructions.",
}

export default spec
