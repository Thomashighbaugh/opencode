import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "docs",
  description: "Fetch official library docs via Context7 MCP API — React, Next.js, Tailwind, Prisma, Express, Django, any npm/PyPI package",
  reminder: "Fetch library docs via Context7 MCP API.",
  inline: true,

  detailedDescription: `Fetches official library documentation via the Context7 MCP API. Two-step process:

1. resolve-library-id: takes a library name (e.g. "Next.js") and returns the Context7-compatible library ID (e.g. "/vercel/next.js").
2. query-docs: takes the library ID + a specific query and returns relevant documentation excerpts and code examples.

Before fetching: check .opencode/context/research/{library-slug}/ for cached results (7-day TTL). After fetching: save to .opencode/context/research/{library-slug}/{query-hash}.md for future reuse.

Use BEFORE external web search when the question is about a library, framework, SDK, API, or CLI tool. Context7 has authoritative, up-to-date docs. Do NOT use for: refactoring, debugging business logic, code review, or general programming concepts.`,

  tools: ["bash"],
  relatedSkills: ["context7-docs"],

  examples: [
    {
      input: "/harvest-context docs 'Next.js 14 App Router server components'",
      approach: "resolve-library-id('Next.js') → '/vercel/next.js'. query-docs('/vercel/next.js', 'App Router server components data fetching'). Save to .opencode/context/research/next-js/app-router-server-components.md."
    }
  ]
}

export default spec