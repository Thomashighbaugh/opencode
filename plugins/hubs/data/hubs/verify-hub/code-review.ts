import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "code-review",
  description: "Delegated code review — pass instructions directly to @code-reviewer",
  reminder: "Delegating review to @code-reviewer agent.",
  agent: "code-reviewer",
  detailedDescription: "Delegates code review to the @code-reviewer agent. The remainder of your prompt will be passed as specific instructions to the agent.",
}

export default spec
