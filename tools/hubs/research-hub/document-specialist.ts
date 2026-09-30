import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "document-specialist",
  description: "Hand external docs lookups to the document specialist",
  reminder: "Delegating to @document-specialist.",
  agent: "@document-specialist",
  detailedDescription: "Delegates directly to the @document-specialist agent. The remainder of your prompt will be passed as specific instructions to the agent.",
}

export default spec
