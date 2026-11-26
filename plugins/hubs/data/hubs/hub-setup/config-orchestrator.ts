import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "config-orchestrator",
  description: "Hand config orchestration to the config orchestrator",
  reminder: "Delegating to @config-orchestrator.",
  agent: "@config-orchestrator",
  detailedDescription: "Delegates directly to the @config-orchestrator agent. The remainder of your prompt will be passed as specific instructions to the agent.",
}

export default spec
