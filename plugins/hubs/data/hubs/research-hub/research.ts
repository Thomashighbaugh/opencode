import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_BASH } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "research",
  description: "Web + GitHub code search — findings cached as context",
  reminder: "Search the web and GitHub for code, cache findings to context.",
  inline: true,

  detailedDescription: `Single research tool that combines web search and GitHub code search, then caches what it finds as durable context.

1. Web search — run one or more websearch queries (SearXNG by default) to gather current best practices, docs, comparisons, and known issues.
2. GitHub code search — use the gh_grep MCP server (grep.app) to find real-world code: how an API is actually called, idiomatic usage, imports and option names. Search for literal code patterns, not keywords.
3. Synthesize — merge web findings and code snippets into one report with key findings, evidence (source URLs and repo/file references), contradictions, and a conclusion.
4. Cache — write web findings to .opencode/context/research/{topic-slug}/ and code snippets to .opencode/context/research/code-snippets/{topic-slug}.md (source repo, language, why the pattern matters). Never re-fetch a cached snippet — grep that directory first.
5. Wiki compliance — update .opencode/context/index.md, append to log.md, add YAML frontmatter, scan for cross-references.
6. Privacy scan before save — if risk detected, divert to .opencode/state/harvest/ instead of committed context.

Use when a question needs external knowledge and concrete code examples together. Check the cache first (context/research/) before spending a network call. For library-specific API docs, prefer /research-hub library-docs (Context7).`,

  tools: TOOLS_BASH,
  relatedSkills: ["context7-docs", "web-to-markdown", "wiki"],
  rules: ["efficiency-first"],
}

export default spec
