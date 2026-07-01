import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "search",
  description: "Semantic search across all context files — find decisions, patterns, research matching a query across .opencode/context/",
  reminder: "Semantic search across context files.",
  inline: true,

  detailedDescription: `Semantic search across all durable context files. Searches .opencode/context/ (decisions, patterns, research, frameworks, theory) for content matching the query semantically — not just keyword matching.

Process:
1. Index all context files (or use an existing vector index).
2. Embed the query.
3. Find semantically similar context.
4. Return ranked results with file paths and relevance scores.

Use when you need to find prior decisions, patterns, or research that's relevant to the current task — "what did we decide about auth last month?", "do we have research on caching strategies?".`,

  tools: ["bash"],
  relatedSkills: ["vectorize-context"],
}

export default spec