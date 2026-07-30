import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "frontend-design",
  description: "Production-grade frontend interfaces — pass instructions directly to @frontend-design",
  reminder: "Delegating to @frontend-design.",
  agent: "@frontend-design",
  inline: true,
  detailedDescription: "Delegates directly to the @frontend-design agent. The remainder of your prompt will be passed as specific instructions to the agent.",
}

export default spec
