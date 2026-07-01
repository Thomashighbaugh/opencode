import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "reset",
  description: "Reset project state — archive .opencode/state and .opencode/context, start fresh with clean slate",
  reminder: "Reset project state with clean slate.",
  inline: true,

  detailedDescription: `Resets the project's Hubs state. Archives (not deletes) .opencode/state/ and .opencode/context/ to timestamped backup directories, then creates fresh empty ones.

This gives you a clean slate without losing history — the archived state can be referenced if needed. After reset, you can re-run /init-project setup to reconfigure from scratch.

Use when the project state has become corrupted, stale, or you want to start over. The archive preserves everything in case you need to recover.`,

  tools: ["bash"],
  relatedSkills: [],

  warnings: [
    "Archives .opencode/state and .opencode/context. The archive is timestamped and recoverable, but running setup afterward will re-detect from scratch."
  ]
}

export default spec