import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_LOADSKILL_BASH_AGENTCONTEXT, RULES_CONTEXT_STRATEGY_SECURITY, SKILLS_WIKI } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "memory",
  description: "Promote durable knowledge to project memory, notepad, or wiki — updates wiki index/log when promoting to .opencode/context/",
  reminder: "Promote knowledge to memory or wiki.",
  skill: "remember",

  detailedDescription: `Promotes extracted knowledge to durable storage. Reviews what was harvested (via /harvest-context session or discovered during the session) and decides where it belongs:

- Project memory (.opencode/state/project-memory.json): cross-session durable facts that should persist but are project-specific.
- Notepad: temporary notes for the current work context.
- Wiki (.opencode/context/): durable documentation that compounds across sessions.
- Decisions (.opencode/context/decisions.md): ADRs — architecture decisions with rationale.
- Patterns (.opencode/context/patterns/): discovered patterns and anti-patterns.

**Wiki compliance**: when promoting to .opencode/context/ (wiki, decisions, patterns), update .opencode/context/index.md, append to .opencode/context/log.md, add YAML frontmatter to new files, scan for cross-references to existing pages.

The remember skill classifies each knowledge item and routes it to the right store. Sensitive data is stripped before committing. Use after /harvest-context session to promote extracted knowledge to durable locations.`,

  tools: TOOLS_LOADSKILL_BASH_AGENTCONTEXT,
  rules: RULES_CONTEXT_STRATEGY_SECURITY,
  relatedSkills: ["remember", "wiki"],
}

export default spec
