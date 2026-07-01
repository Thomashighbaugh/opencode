import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "memory",
  description: "Promote durable knowledge to project memory, notepad, or wiki",
  reminder: "Promote knowledge to memory or wiki.",
  skill: "remember",

  detailedDescription: `Promotes extracted knowledge to durable storage. Reviews what was harvested (via /harvest-context session or discovered during the session) and decides where it belongs:

- Project memory (.opencode/state/project-memory.json): cross-session durable facts that should persist but are project-specific.
- Notepad: temporary notes for the current work context.
- Wiki (.opencode/context/): durable documentation that compounds across sessions.
- Decisions (.opencode/context/decisions.md): ADRs — architecture decisions with rationale.
- Patterns (.opencode/context/patterns/): discovered patterns and anti-patterns.

The remember skill classifies each knowledge item and routes it to the right store. Sensitive data is stripped before committing. Use after /harvest-context session to promote extracted knowledge to durable locations.`,

  tools: ["loadSkill", "bash", "agentContext"],
  rules: ["context-strategy", "security"],
  relatedSkills: ["wiki"],
}

export default spec