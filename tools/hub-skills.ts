import { HubDefinition } from "./hub-data"
import { subcommands } from "./hubs/skills"

const hub: HubDefinition = {
  name: "skills",
  description: "Skill manager — CRUD, search, sync, package, and validate OpenCode skills across user, project, and built-in scopes",
  stateDir: "",
  subcommands
}

export default hub