import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "web-research",
  description: "Multi-source web research — search multiple queries in parallel via websearch, fetch top results via webfetch, synthesize findings into a structured research report saved to .opencode/state/harvest/",
  reminder: "Search, fetch, and synthesize web research into a report.",
  inline: true,

  detailedDescription: `Multi-source web research pipeline for the harvest-context hub. Same mechanism as /ideation web-research but saves to .opencode/state/harvest/ instead of ideation work-products.

1. Generate multiple search queries from the research question.
2. Run websearch in parallel for all queries.
3. Fetch top results via webfetch (parallel).
4. Synthesize into a structured report with key findings, evidence (source URLs), contradictions, conclusion.

Save to .opencode/state/harvest/ and optionally promote to .opencode/context/research/ via /harvest-context memory.

Use for research questions that require external knowledge. Prefer /harvest-context docs (Context7) first for library-specific questions.`,

  tools: ["bash"],
  relatedSkills: ["context7-docs", "web-to-markdown"],
}

export default spec