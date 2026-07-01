import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "consume",
  description: "Ingest a file, directory, or URL — extract text content and save as durable context in .opencode/context/research/",
  reminder: "Ingest and save content as durable context.",
  inline: true,

  detailedDescription: `Ingests external content (files, directories, URLs) and saves it as durable context. Process:

1. Take the input: a file path, directory, or URL.
2. Extract text content: for files, read directly; for directories, read all text files; for URLs, fetch via webfetch or web-to-markdown skill (handles JS-rendered pages).
3. Clean and convert to markdown.
4. Save to .opencode/context/research/{source-slug}/{timestamp}.md.

Privacy scan runs before saving to prevent committing secrets/PII. Use when you have external documentation, papers, or reference material that should be part of the project's durable knowledge.`,

  tools: ["bash"],
  rules: ["security"],
  relatedSkills: ["document-processor", "web-to-markdown", "privacy-scan"],
}

export default spec