import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "journal",
  description: "Event-sourced journal for orchestration runs — deterministic replay, time-travel debugging, SHA-256 checksums",
  reminder: "Set up event-sourced orchestration journal.",
  inline: true,

  detailedDescription: `Sets up an event-sourced journal for orchestration runs. Every event (task dispatch, completion, failure, checkpoint) is appended as an immutable event with a SHA-256 checksum.

Features:
- Deterministic replay: re-run an orchestration from the journal to see exactly what happened.
- Time-travel debugging: jump to any point in the execution and inspect state.
- Integrity: checksums detect tampering or corruption.
- Audit trail: full history of what the agent did and why.

The journal lives in .opencode/state/orchestration/journal/. Use when you need observability into orchestration runs — especially for debugging "why did the agent do X?" or auditing agent behavior.`,

  tools: ["bash"],
  relatedSkills: [],
}

export default spec