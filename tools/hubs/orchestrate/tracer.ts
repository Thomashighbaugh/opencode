import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "tracer",
  description: "Evidence-driven causal tracing — pass instructions directly to @tracer",
  reminder: "Delegating to @tracer.",
  agent: "@tracer",
  inline: true,
  detailedDescription: "Delegates directly to the @tracer agent. The remainder of your prompt will be passed as specific instructions to the agent.",
}

export default spec
