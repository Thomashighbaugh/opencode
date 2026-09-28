import { HubDefinition } from "./hub-data"
import { subcommands } from "./hubs/maintain-hub"

const hub: HubDefinition = {
  name: "maintain-hub",
  description: "Project hygiene, insights, and self-improvement",
  stateDir: "",
  subcommands
}

export default hub
