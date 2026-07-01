import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "purge",
  description: "Clean up stale orchestration state — remove old runs, free disk space, preserve recent history",
  reminder: "Purge stale orchestration state.",
  inline: true,

  detailedDescription: `Cleans up stale orchestration state to free disk space. Removes:

- Old orchestration runs (keeps N most recent, configurable).
- Expired checkpoints.
- Completed session state.
- Orphaned state files (referencing sessions that no longer exist).

Preserves recent history and the current session. Use periodically when .opencode/state/ has grown large.`,

  tools: ["bash"],
  rules: ["context-strategy"],
  relatedSkills: [],
}

export default spec