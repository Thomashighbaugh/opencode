import { HubDefinition } from "./hub-data"
import { subcommands } from "./hubs/harvest-context"

const hub: HubDefinition = {
  name: "harvest-context",
  description: "Context and artifact hub — extract, generate, and manage project context",
  stateDir: "harvest",
  subcommands
}

export default hub