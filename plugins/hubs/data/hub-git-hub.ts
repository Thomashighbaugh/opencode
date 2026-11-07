import { HubDefinition } from "./hub-data"
import { subcommands } from "./hubs/git-hub"

const hub: HubDefinition = {
  name: "git-hub",
  description: "Version control, pull requests, and releases",
  stateDir: "",
  subcommands
}

export default hub
