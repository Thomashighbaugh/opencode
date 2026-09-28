import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "debugger",
  description: "Root-cause analysis — pass instructions directly to @debugger",
  reminder: "Delegating to @debugger.",
  agent: "@debugger",
  detailedDescription: "Delegates directly to the @debugger agent. The remainder of your prompt will be passed as specific instructions to the agent.",
}

export default spec
