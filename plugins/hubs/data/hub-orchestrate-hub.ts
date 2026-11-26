import { HubDefinition } from "./hub-data"
import { subcommands } from "./hubs/orchestrate-hub"

const hub: HubDefinition = {
  name: "orchestrate-hub",
  description: "Run agents — autonomous modes and multi-agent topologies",
  stateDir: "orchestration",
  subcommands
}

export default hub
