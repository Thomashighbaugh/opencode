import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "qa-tester",
  description: "Interactive CLI testing specialist — pass instructions directly to @qa-tester",
  reminder: "Delegating to @qa-tester.",
  agent: "@qa-tester",
  inline: true,
  detailedDescription: "Delegates directly to the @qa-tester agent. The remainder of your prompt will be passed as specific instructions to the agent.",
}

export default spec
