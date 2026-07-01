import { HubDefinition } from "./hub-data"
import { subcommands } from "./hubs/project"

const hub: HubDefinition = {
  name: "project",
  description: "Project operations hub — tests, git workflows, code refactoring, optimization, icons, changelogs, and file organization",
  stateDir: "",
  subcommands
}

export default hub