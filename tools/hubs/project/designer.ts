import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "designer",
  description: "UI/UX designer-developer — pass instructions directly to @designer",
  reminder: "Delegating to @designer.",
  agent: "@designer",
  inline: true,
  detailedDescription: "Delegates directly to the @designer agent. The remainder of your prompt will be passed as specific instructions to the agent.",
}

export default spec
