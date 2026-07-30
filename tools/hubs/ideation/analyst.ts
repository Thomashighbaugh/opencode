import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "analyst",
  description: "Strategic analyst — pass instructions directly to @analyst",
  reminder: "Delegating to @analyst.",
  agent: "@analyst",
  inline: true,
  detailedDescription: "Delegates directly to the @analyst agent. The remainder of your prompt will be passed as specific instructions to the agent.",
}

export default spec
