import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "prompt-simplifier",
  description: "Simplify prompt logic — pass instructions directly to @prompt-simplifier",
  reminder: "Delegating to @prompt-simplifier.",
  agent: "@prompt-simplifier",
  inline: true,
  detailedDescription: "Delegates directly to the @prompt-simplifier agent. The remainder of your prompt will be passed as specific instructions to the agent.",
}

export default spec
