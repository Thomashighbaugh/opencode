import { HubDefinition } from "./hub-data"
import { subcommands } from "./hubs/orchestrate"

const hub: HubDefinition = {
  name: "orchestrate",
  description: "Execution hub — pick an orchestration pattern, load a plan, and build",
  stateDir: "orchestration",
  subcommands
}

export default hub