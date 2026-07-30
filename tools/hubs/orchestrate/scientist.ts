import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "scientist",
  description: "Data analysis specialist — pass instructions directly to @scientist",
  reminder: "Delegating to @scientist.",
  agent: "@scientist",
  inline: true,
  detailedDescription: "Delegates directly to the @scientist agent. The remainder of your prompt will be passed as specific instructions to the agent.",
}

export default spec
