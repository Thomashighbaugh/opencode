import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "pt-debt",
  description: "Harvest deferred ponytail shortcuts",
  reminder: "Harvesting deferred ponytail debt.",
  inline: true,
  detailedDescription: "Harvests `ponytail:` comments deferred into the debt ledger.",
}

export default spec
