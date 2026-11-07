import { HubDefinition } from "./hub-data"
import { subcommands } from "./hubs/plan-hub"

const hub: HubDefinition = {
  name: "plan-hub",
  description: "Requirements, roadmaps, and work decomposition",
  stateDir: "ideation",
  subcommands
}

export default hub
