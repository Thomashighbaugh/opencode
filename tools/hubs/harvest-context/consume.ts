import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_BASH, RULES_SECURITY, SKILLS_WIKI } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "consume",
  description: "Ingest a file, directory, or URL — extract text content, save as durable context, and update wiki index/log",
  reminder: "Ingest and save content as durable context.",
  inline: true,

  detailedDescription: `Ingests external content (files, directories, URLs) and saves it as durable context. Process:

1. Take the input: a file path, directory, or URL.
2. Extract text content: for files, read directly; for directories, read all text files; for URLs, fetch via webfetch or web-to-markdown skill (handles JS-rendered pages).
3. Clean and convert to markdown.
4. Save to .opencode/context/research/{source-slug}/{timestamp}.md.
5. **Wiki compliance**: update .opencode/context/index.md (catalog), append to .opencode/context/log.md, add YAML frontmatter to the new file, scan for cross-references to existing pages.

Privacy scan runs before saving to prevent committing secrets/PII. Use when you have external documentation, papers, or reference material that should be part of the project's durable knowledge.`,

  tools: TOOLS_BASH,
  rules: RULES_SECURITY,
  relatedSkills: ["document-processor", "web-to-markdown", "privacy-scan", "wiki"],
}

export default spec
