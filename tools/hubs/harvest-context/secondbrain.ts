import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "secondbrain",
  description: "Privacy-first local knowledge base — markdown+Git with role packs and self-healing cross-references",
  reminder: "Set up local-first knowledge management.",
  inline: true,

  detailedDescription: `Sets up a privacy-first local knowledge base ("second brain") using markdown files + Git. Features:

- Markdown-first: all knowledge is in plain markdown files. No database, no cloud service.
- Git-backed: versioned, diffable, branchable.
- Role packs: different views/entry points for different use cases (developer, architect, researcher).
- Self-healing cross-references: broken links are detected and repaired automatically.

The knowledge base lives in .opencode/context/ and integrates with the existing durable context system. Use when you want a structured, long-lived knowledge base that compounds across sessions and is fully under your control.`,

  tools: ["bash"],
  rules: ["context-strategy"],
  relatedSkills: ["wiki"],
}

export default spec