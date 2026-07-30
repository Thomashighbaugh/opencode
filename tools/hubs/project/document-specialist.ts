import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "document-specialist",
  description: "External docs/reference specialist — pass instructions directly to @document-specialist",
  reminder: "Delegating to @document-specialist.",
  agent: "@document-specialist",
  inline: true,
  detailedDescription: "Delegates directly to the @document-specialist agent. The remainder of your prompt will be passed as specific instructions to the agent.",
}

export default spec
