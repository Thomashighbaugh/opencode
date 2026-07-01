import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "diff",
  description: "Context diff — compare current context state to a previous checkpoint, showing new decisions, patterns, and changes since last harvest",
  reminder: "Diff context against previous checkpoint.",
  inline: true,

  detailedDescription: `Compares the current context state to a previous checkpoint to show what's changed since. Reveals:

- New decisions added to decisions.md
- New patterns discovered
- New research added
- Files added, modified, or removed from .opencode/context/

The diff helps answer "what did we learn since last time?" — useful for standups, retrospectives, or just tracking knowledge growth.

Use after a work session to see what durable knowledge was gained, or before a harvest to decide what's worth promoting.`,

  tools: ["bash"],
  rules: ["context-strategy"],
  relatedSkills: [],
}

export default spec