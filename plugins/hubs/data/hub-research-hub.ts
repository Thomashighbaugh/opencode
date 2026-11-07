import { HubDefinition } from "./hub-data"
import { subcommands } from "./hubs/research-hub"

const hub: HubDefinition = {
  name: "research-hub",
  description: "Investigation and discovery — web, competitive, tech-eval, codebase analysis",
  stateDir: "",
  subcommands
}

export default hub
