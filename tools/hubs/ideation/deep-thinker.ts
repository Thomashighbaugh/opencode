import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "deep-thinker",
  description: "Structured thinking partner — pass instructions directly to @deep-thinker",
  reminder: "Delegating to @deep-thinker.",
  agent: "@deep-thinker",
  inline: true,
  detailedDescription: "Delegates directly to the @deep-thinker agent. The remainder of your prompt will be passed as specific instructions to the agent.",
}

export default spec
