import { HubDefinition } from "./hub-data"
import { subcommands } from "./hubs/verify-hub"

const hub: HubDefinition = {
  name: "verify-hub",
  description: "Review, test, and debug — proving the work is correct",
  stateDir: "",
  subcommands
}

export default hub
