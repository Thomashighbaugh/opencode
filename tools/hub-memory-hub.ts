import { HubDefinition } from "./hub-data"
import { subcommands } from "./hubs/memory-hub"

const hub: HubDefinition = {
  name: "memory-hub",
  description: "Durable knowledge and session context — harvest, compress, search, journal",
  stateDir: "harvest",
  subcommands
}

export default hub
