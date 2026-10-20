import { HubDefinition } from "./hub-data"
import { subcommands } from "./hubs/scaffold-hub"

// `/scaffold-hub` — one subcommand: scaffold a new hub subcommand.
//
// Was briefly erased into hub-setup (which absorbed its one subcommand) but
// restored because the name is the right description of what it does.
const hub: HubDefinition = {
  name: "scaffold-hub",
  description: "Scaffold new hub subcommands",
  stateDir: "init",
  subcommands,
}

export default hub
