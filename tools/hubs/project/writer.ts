import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "writer",
  description: "Technical documentation writer — pass instructions directly to @writer",
  reminder: "Delegating to @writer.",
  agent: "@writer",
  inline: true,
  detailedDescription: "Delegates directly to the @writer agent. The remainder of your prompt will be passed as specific instructions to the agent.",
}

export default spec
