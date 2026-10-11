import { HubDefinition } from "./hub-data"
import { subcommands } from "./hubs/memory-hub"

const hub: HubDefinition = {
  name: "memory-hub",
  description: "Durable knowledge and session context — harvest, compress, search, vectorize",
  stateDir: "harvest",
  subcommands
}

export default hub
