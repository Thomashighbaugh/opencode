import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "requirements-analyzer",
  description: "Hand feature requirements analysis to the specialist",
  reminder: "Delegating to @requirements-analyzer.",
  agent: "@requirements-analyzer",
  detailedDescription: "Delegates directly to the @requirements-analyzer agent. The remainder of your prompt will be passed as specific instructions to the agent.",
}

export default spec
