import { HubDefinition } from "./hub-data"
import { subcommands } from "./hubs/orchestrate-hub"

const hub: HubDefinition = {
  name: "orchestrate-hub",
  description: "Autonomous execution modes and orchestration loops",
  stateDir: "orchestration",
  subcommands
}

export default hub
