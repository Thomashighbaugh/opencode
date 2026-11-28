import { HubDefinition } from "./hub-data"
import { subcommands } from "./hubs/think-hub"

// `/think-hub` — ideation and planning.
//
// Merged from the former ideate menu (diverge: brainstorm, debate, frameworks) and
// the former plan menu (converge: requirements, decomposition, roadmaps). One workflow:
// generate options, then shape them into an executable plan.
const hub: HubDefinition = {
  name: "think-hub",
  description: "Ideation and planning — diverge on options, converge on a plan",
  stateDir: "ideation",
  subcommands,
}

export default hub
