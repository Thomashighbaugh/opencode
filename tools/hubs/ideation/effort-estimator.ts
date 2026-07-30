import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "effort-estimator",
  description: "Estimate development effort — pass instructions directly to @effort-estimator",
  reminder: "Delegating to @effort-estimator.",
  agent: "@effort-estimator",
  inline: true,
  detailedDescription: "Delegates directly to the @effort-estimator agent. The remainder of your prompt will be passed as specific instructions to the agent.",
}

export default spec
