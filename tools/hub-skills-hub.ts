import { HubDefinition } from "./hub-data"
import { subcommands } from "./hubs/skills-hub"

const hub: HubDefinition = {
  name: "skills-hub",
  description: "Skill authoring and lifecycle management",
  stateDir: "",
  subcommands
}

export default hub
