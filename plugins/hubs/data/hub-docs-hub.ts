import { HubDefinition } from "./hub-data"
import { subcommands } from "./hubs/docs-hub"

const hub: HubDefinition = {
  name: "docs-hub",
  description: "Project documentation — AGENTS.md, README, and technical writing",
  stateDir: "",
  subcommands
}

export default hub
