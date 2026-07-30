import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "security-reviewer",
  description: "Security vulnerability detection — pass instructions directly to @security-reviewer",
  reminder: "Delegating to @security-reviewer.",
  agent: "@security-reviewer",
  inline: true,
  detailedDescription: "Delegates directly to the @security-reviewer agent. The remainder of your prompt will be passed as specific instructions to the agent.",
}

export default spec
