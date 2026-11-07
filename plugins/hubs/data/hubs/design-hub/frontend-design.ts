import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "frontend-design",
  description: "Hand production frontend work to the frontend designer",
  reminder: "Delegating to @frontend-design.",
  agent: "@frontend-design",
  detailedDescription: "Delegates directly to the @frontend-design agent. The remainder of your prompt will be passed as specific instructions to the agent.",
}

export default spec
