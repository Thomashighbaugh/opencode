import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "executor",
  description: "Focused task executor — pass instructions directly to @executor",
  reminder: "Delegating to @executor.",
  agent: "@executor",
  inline: true,
  detailedDescription: "Delegates directly to the @executor agent. The remainder of your prompt will be passed as specific instructions to the agent.",
}

export default spec
