import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "requirements-analyzer",
  description: "Analyze feature requirements — pass instructions directly to @requirements-analyzer",
  reminder: "Delegating to @requirements-analyzer.",
  agent: "@requirements-analyzer",
  inline: true,
  detailedDescription: "Delegates directly to the @requirements-analyzer agent. The remainder of your prompt will be passed as specific instructions to the agent.",
}

export default spec
