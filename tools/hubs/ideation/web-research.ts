import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "web-research",
  description: "Multi-source web research — search multiple queries in parallel via websearch, fetch top results via webfetch, synthesize findings into a structured research report saved to .opencode/state/ideation/work-products/",
  reminder: "Search, fetch, and synthesize web research into a structured report.",
  inline: true,

  detailedDescription: `Multi-source web research pipeline:

1. Generate multiple search queries from the research question (different phrasings to catch different results).
2. Run websearch in parallel for all queries.
3. Fetch the top results from each search via webfetch (parallel).
4. Synthesize the fetched content into a structured research report with: key findings, supporting evidence (with source URLs), contradictions between sources, and a conclusion.

The report is saved to .opencode/state/ideation/work-products/ as a markdown document. It becomes durable context for subsequent planning.

Use when the ideation question requires external knowledge (current best practices, library comparisons, how-to guides). The multi-query approach catches more relevant results than a single search.`,

  tools: ["bash"],
  relatedSkills: ["context7-docs"],

  examples: [
    {
      input: "/ideation web-research 'Postgres vs MongoDB for a multi-tenant SaaS with 1000 tenants'",
      approach: "Queries: 'PostgreSQL multi-tenant SaaS', 'MongoDB multi-tenant', 'Postgres vs MongoDB SaaS comparison'. Fetch top 3 from each. Synthesize: Postgres better for relational + transactions, MongoDB for flexible schemas. Conclusion depends on data shape."
    }
  ]
}

export default spec