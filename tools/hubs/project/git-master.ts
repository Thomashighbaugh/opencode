import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "git-master",
  description: "Git expert for atomic commits — pass instructions directly to @git-master",
  reminder: "Delegating to @git-master.",
  agent: "@git-master",
  inline: true,
  detailedDescription: "Delegates directly to the @git-master agent. The remainder of your prompt will be passed as specific instructions to the agent.",
}

export default spec
