import { HubDefinition } from "./hub-data"
import { subcommands } from "./hubs/ideate-hub"

const hub: HubDefinition = {
  name: "ideate-hub",
  description: "Divergent thinking and idea generation",
  stateDir: "ideation",
  subcommands
}

export default hub
