import { HubDefinition } from "./hub-data"
import { subcommands } from "./hubs/verify-hub"

const hub: HubDefinition = {
  name: "verify-hub",
  description: "Quality and health — review, test, debug, hygiene, insights",
  stateDir: "",
  subcommands
}

export default hub
