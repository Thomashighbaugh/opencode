import { HubDefinition } from "./hub-data"
import { subcommands } from "./hubs/ideation"

const hub: HubDefinition = {
  name: "ideation",
  description: "Planning, research, and ideation hub",
  stateDir: "ideation",
  subcommands
}

export default hub