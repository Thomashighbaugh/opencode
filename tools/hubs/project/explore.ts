import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "explore",
  description: "Codebase search specialist — pass instructions directly to @explore",
  reminder: "Delegating to @explore.",
  agent: "@explore",
  inline: true,
  detailedDescription: "Delegates directly to the @explore agent. The remainder of your prompt will be passed as specific instructions to the agent.",
}

export default spec
