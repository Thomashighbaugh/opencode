import { HubDefinition } from "./hub-data"

const hub: HubDefinition = {
  name: "harvest-context",
  description: "Context and artifact hub — extract, generate, and manage project context",
  stateDir: "harvest",
  subcommands: [
    { label: "session", description: "Extract decisions, patterns, learnings from current session", inline: true, reminder: "Extract decisions and patterns from session." },
    { label: "codebase", description: "Generate hierarchical AGENTS.md across the codebase", skill: "deepinit", reminder: "Generate hierarchical AGENTS.md documentation." },
    { label: "skill", description: "Create a reusable skill from session knowledge", skill: "skill-creator", reminder: "Extract a repeatable workflow as a skill." },
    { label: "agent", description: "Create a project-specific agent", skill: "opencode-agent-creator", reminder: "Create a project-specific agent." },
    { label: "rule", description: "Create a project rule (.opencode/rules/)", inline: true, reminder: "Create a project rule file." },
    { label: "command", description: "Create a project slash command", skill: "opencode-command-creator", reminder: "Create a project slash command." },
    { label: "memory", description: "Promote durable knowledge to project memory, notepad, or wiki", skill: "remember", reminder: "Promote knowledge to memory or wiki." },
    { label: "docs", description: "Fetch official library docs via Context7 MCP API — React, Next.js, Tailwind, Prisma, Express, Django, any npm/PyPI package", inline: true, reminder: "Fetch library docs via Context7 MCP API." },
    { label: "web-research", description: "Multi-source web research — search multiple queries in parallel via websearch, fetch top results via webfetch, synthesize findings into a structured research report saved to .opencode/state/harvest/", inline: true, reminder: "Search, fetch, and synthesize web research into a report." },
    { label: "compare", description: "Compare alternatives via web research — research multiple options (libraries, tools, approaches) via websearch + webfetch, produce structured comparison table with recommendations", inline: true, reminder: "Research and compare alternatives with structured comparison." },
    { label: "decompose", description: "Break down a concept or goal into smaller actionable units", agent: "planner", reminder: "Decompose concept into actionable tasks." },
    { label: "context", description: "Manage context files — harvest, extract, organize, compact, map", inline: true, reminder: "Harvest, organize, or compact context." },
    { label: "consume", description: "Ingest a file, directory, or URL — extract text content and save as durable context in .opencode/context/research/", inline: true, reminder: "Ingest and save content as durable context." },
    { label: "compress", description: "Token compression strategies — density filtering (~29% savings), command output compression (~47%), library cache compression (~94%)", inline: true, reminder: "Apply 4-layer token compression." },
    { label: "secondbrain", description: "Privacy-first local knowledge base — markdown+Git with role packs and self-healing cross-references", inline: true, reminder: "Set up local-first knowledge management." },
    { label: "journal", description: "Event-sourced journal for orchestration runs — deterministic replay, time-travel debugging, SHA-256 checksums", inline: true, reminder: "Set up event-sourced orchestration journal." },
    { label: "search", description: "Semantic search across all context files — find decisions, patterns, research matching a query across .opencode/context/", inline: true, reminder: "Semantic search across context files." },
    { label: "prune", description: "Stale context management — identify old or superseded context files, archive or delete them to keep .opencode/context/ healthy", inline: true, reminder: "Identify and archive stale context files." },
    { label: "export", description: "Export context as a readable summary, markdown bundle, or team report — share what the project knows", inline: true, reminder: "Export context as readable summary." },
    { label: "diff", description: "Context diff — compare current context state to a previous checkpoint, showing new decisions, patterns, and changes since last harvest", inline: true, reminder: "Diff context against previous checkpoint." },
    { label: "sweep", description: "Scan .opencode/ for files that should be gitignored but aren't — prevents bloat that breaks git push", inline: true, reminder: "Sweep .opencode/ for gitignore violations." }
  ]
}

export default hub
