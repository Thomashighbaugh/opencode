import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_RUNTIME } from "../shared-spec-fragments"

const spec: HubSubcommandSpec = {
  label: "context-audit",
  description: "Audit durable context structure — files, wiki, decisions, vector DB",
  reminder: "Audit the context store's structure.",
  inline: true,

  detailedDescription: `Structural audit of the durable context store. This is not a session-efficiency audit (that is token-use-audit); it inspects what is stored and whether it is well-formed.

1. Call the \`runtime\` tool with action \`memory-review\` for the memory-side view (counts, by-origin, recent).
2. Inspect .opencode/context/: index.md coverage, log.md continuity, frontmatter on pages, orphan pages, and decisions/patterns/research presence.
3. Confirm the vector store exists and is current (.opencode/state/vector/).
4. Report gaps with concrete fixes (missing index entries, pages without frontmatter, stale or orphaned files).

Use before a context cleanup or when retrieval feels thin.`,

  tools: TOOLS_RUNTIME,
  relatedSkills: ["wiki", "vectorize-context"],
}

export default spec
