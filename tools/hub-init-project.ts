import { HubDefinition } from "./hub-data"
import { subcommands } from "./hubs/init-project"

const hub: HubDefinition = {
  name: "init-project",
  description: "Initialize or refine project setup",
  stateDir: "init",
  subcommands
}

export default hub