import { HubDefinition } from "./hub-data"
import { subcommands } from "./hubs/build-hub"

const hub: HubDefinition = {
  name: "build-hub",
  description: "Implementation, refactoring, and code transformation",
  stateDir: "",
  subcommands
}

export default hub
