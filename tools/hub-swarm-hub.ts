import { HubDefinition } from "./hub-data"
import { subcommands } from "./hubs/swarm-hub"

const hub: HubDefinition = {
  name: "swarm-hub",
  description: "Multi-agent topologies and swarm patterns",
  stateDir: "orchestration",
  subcommands
}

export default hub
