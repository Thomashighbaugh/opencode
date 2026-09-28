import { HubDefinition } from "./hub-data"
import { subcommands } from "./hubs/design-hub"

const hub: HubDefinition = {
  name: "design-hub",
  description: "Architecture, design, and documentation authoring",
  stateDir: "",
  subcommands
}

export default hub
