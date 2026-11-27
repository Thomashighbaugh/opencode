import { HubDefinition } from "./hub-data"
import { subcommands } from "./hubs/runtime-hub"

// `/runtime-hub` — runtime efficiency and observability.
//
// The runtime engine (rio) keeps the hooks and tools; this menu is the only
// entry point for its status, flags, health, and token-use commands. It is a
// distinct domain from verification (code health) and knowledge (durable
// context), so it gets its own menu instead of scattering into those.
const hub: HubDefinition = {
  name: "runtime-hub",
  description: "Runtime efficiency and token use: status, health, savings, routing",
  stateDir: "",
  subcommands,
}

export default hub
