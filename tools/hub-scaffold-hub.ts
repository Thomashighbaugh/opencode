import { HubDefinition } from "./hub-data"
import { subcommands } from "./hubs/scaffold-hub"

const hub: HubDefinition = {
  name: "scaffold-hub",
  description: "Project bootstrap and configuration — detect, provision, verify, repair",
  stateDir: "init",
  subcommands
}

export default hub
