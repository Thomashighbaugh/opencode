import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "security-reviewer",
  description: "Hand a security audit to the security reviewer",
  reminder: "Delegating to @security-reviewer.",
  agent: "@security-reviewer",
  detailedDescription: "Delegates directly to the @security-reviewer agent. The remainder of your prompt will be passed as specific instructions to the agent.",
}

export default spec
