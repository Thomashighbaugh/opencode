import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "convention-extractor",
  description: "Extract coding conventions — pass instructions directly to @convention-extractor",
  reminder: "Delegating to @convention-extractor.",
  agent: "@convention-extractor",
  inline: true,
  detailedDescription: "Delegates directly to the @convention-extractor agent. The remainder of your prompt will be passed as specific instructions to the agent.",
}

export default spec
