import { HubDefinition } from "./hub-data"
import { subcommands } from "./hubs/resource-hub"

const hub: HubDefinition = {
  name: "resource-hub",
  description: "Authoring and discovery of agents, skills, rules, and commands",
  stateDir: "",
  subcommands
}

export default hub
