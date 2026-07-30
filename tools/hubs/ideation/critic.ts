import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "critic",
  description: "Work plan and code review expert — pass instructions directly to @critic",
  reminder: "Delegating to @critic.",
  agent: "@critic",
  inline: true,
  detailedDescription: "Delegates directly to the @critic agent. The remainder of your prompt will be passed as specific instructions to the agent.",
}

export default spec
