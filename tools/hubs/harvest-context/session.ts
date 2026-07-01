import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "session",
  description: "Extract decisions, patterns, learnings from current session",
  reminder: "Extract decisions and patterns from session.",
  inline: true,

  detailedDescription: `Extracts durable knowledge from the current conversation session. Scans the session for:

- Decisions made (and their rationale)
- Patterns discovered (code, architecture, process)
- Lessons learned (what worked, what didn't)
- Anti-patterns identified
- Unresolved questions

Each extracted item is classified and saved to .opencode/state/harvest/ as a structured markdown document. The output can then be promoted to durable context (.opencode/context/) via /harvest-context memory.

This is the first step of context harvesting — extract, then promote. Use at the end of a session (or when context is getting large) to preserve knowledge before it's lost to compaction.`,

  tools: ["bash"],
  relatedSkills: ["remember"],

  examples: [
    {
      input: "/harvest-context session",
      approach: "Scan conversation. Find: decision 'use Redis for sessions' (rationale: faster than DB). Pattern: 'repository pattern for all data access'. Lesson: 'N+1 queries on dashboard'. Save to .opencode/state/harvest/session-{timestamp}.md."
    }
  ]
}

export default spec