import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "commit-drafter",
  description: "Structure conventional commit messages — pass instructions directly to @commit-drafter",
  reminder: "Delegating to @commit-drafter.",
  agent: "@commit-drafter",
  inline: true,
  detailedDescription: "Delegates directly to the @commit-drafter agent. The remainder of your prompt will be passed as specific instructions to the agent.",
}

export default spec
