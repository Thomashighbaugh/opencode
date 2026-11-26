import { HubDefinition } from "./hub-data"
import { subcommands } from "./hubs/knowledge-hub"

// `/knowledge-hub` — durable knowledge and documentation.
//
// Merged from memory-hub (capture, context, vectorize) and docs-hub
// (AGENTS.md, README, technical writing). Both produce and retain knowledge,
// so they share one menu instead of two.
const hub: HubDefinition = {
  name: "knowledge-hub",
  description: "Durable knowledge and documentation — capture, retrieve, write",
  stateDir: "",
  subcommands,
}

export default hub
