import { HubDefinition } from "./hub-data"
import { subcommands } from "./hubs/hub-setup"

// `/hub-setup` — set up and refresh a project's OpenCode configuration.
//
// Restores the `/init-project` front door, and absorbs `scaffold-hub`, which named
// one phase of the job ("scaffold") and so obscured the other eleven: a user
// looking for "refresh my project config" had no reason to open a menu called
// scaffold. Nothing was added or dropped in the merge — the subcommand set is
// exactly scaffold-hub's twelve.
//
// Both older names still resolve, via LEGACY_ROUTE_MAP:
//   /init-project <sub>  →  hub-setup/<sub>   (the pre-2026-09-28 name)
//   /scaffold-hub <sub>  →  hub-setup/<sub>   (the immediately-previous name)
const hub: HubDefinition = {
  name: "hub-setup",
  description: "Set up and refresh a project's OpenCode configuration",
  // Unchanged from scaffold-hub, so existing checkpoints in .opencode/state/init/
  // are still found by /hub-setup resume and /hub-setup status.
  stateDir: "init",
  subcommands,
}

export default hub