import { HubDefinition } from "./hub-data"
import { subcommands } from "./hubs/hub-setup"

// `/hub-setup` — set up and refresh a project's OpenCode configuration.
//
// Restores the `/init-project` front door. `/scaffold-hub` (the one-subcommand
// hub for scaffolding new hub subcommands) was briefly absorbed and then restored
// as its own hub — its name describes what it does.
//
// `/init-project <sub>` still resolves via LEGACY_ROUTE_MAP.
const hub: HubDefinition = {
  name: "hub-setup",
  description: "Set up and refresh a project's OpenCode configuration",
  // Unchanged from scaffold-hub, so existing checkpoints in .opencode/state/init/
  // are still found by /hub-setup resume and /hub-setup status.
  stateDir: "init",
  subcommands,
}

export default hub
