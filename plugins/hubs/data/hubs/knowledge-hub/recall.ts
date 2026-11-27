import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_RUNTIME } from "../shared-spec-fragments"

const spec: HubSubcommandSpec = {
  label: "recall",
  description: "Semantic + lexical recall over memories and durable context",
  reminder: "Recall memories and context for a query.",
  inline: true,

  detailedDescription: `Recall across both knowledge stores in one command:

1. **Memories** (rio, memory.db): call the \`runtime\` tool with action \`recall\` and the user's text in the \`query\` field. It runs hybrid FTS5 + sqlite-vec retrieval, reranks, applies decay, and returns scored memories with their category.
2. **Durable context** (.opencode/context/): query the capture store with hubDocs action \`search\`, then use the vector index for semantic recall across decisions, patterns, research, frameworks, and theory.

Return ranked results with their source (memory or context file), relevance score, and a one-line reason. Prefer the highest-scoring hits; do not dump the whole store.

Use when you need prior decisions, patterns, or research relevant to the current task: "what did we decide about auth last month?", "do we have research on caching strategies?".`,

  tools: TOOLS_RUNTIME,
  relatedSkills: ["vectorize-context", "remember"],
}

export default spec
