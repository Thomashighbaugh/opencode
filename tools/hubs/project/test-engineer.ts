import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "test-engineer",
  description: "Test strategy specialist — pass instructions directly to @test-engineer",
  reminder: "Delegating to @test-engineer.",
  agent: "@test-engineer",
  inline: true,
  detailedDescription: "Delegates directly to the @test-engineer agent. The remainder of your prompt will be passed as specific instructions to the agent.",
}

export default spec
