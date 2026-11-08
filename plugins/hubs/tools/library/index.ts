/**
 * library/index.ts — the `hubDocs` tool definition.
 *
 * Registered by the hubs plugin (`plugins/hubs/index.ts`) next to `hubMenu`.
 * The tool is part of the hub package because the hub subcommands and the
 * skills bundled with them are its only consumers; there is no npm package and
 * no CLI.
 */

import { annotate, get, ingest, list, migrate, prune, refresh, search } from "./store.ts"

const INPUT = {
  type: "object",
  properties: {
    action: {
      type: "string",
      enum: ["ingest", "get", "list", "search", "annotate", "refresh", "prune", "migrate"],
      description: "Operation to perform",
    },
    url: { type: "string", description: "Canonical source URL" },
    markdown: { type: "string", description: "Document body as markdown (the tool never fetches)" },
    title: { type: "string" },
    collection: { type: "string", description: "Vendor/product/domain bucket" },
    source_type: { type: "string", enum: ["official", "maintainer", "community", "first-party"] },
    language: { type: "string" },
    version: { type: "string" },
    tags: { type: "array", items: { type: "string" } },
    summary: { type: "string" },
    retrieved_at: { type: "string", description: "ISO date; defaults to today" },
    id: { type: "string", description: "Document id, collection/slug" },
    part: { type: "number", description: "1-based part for split documents" },
    query: { type: "string" },
    tag: { type: "string" },
    limit: { type: "number" },
    stale: { type: "boolean", description: "list: only stale (true) or fresh (false)" },
    dry_run: { type: "boolean" },
    note: { type: "string", description: "annotate: note text" },
  },
  required: ["action"],
  additionalProperties: false,
} as const

const DESCRIPTION = [
  "Captured-document store. Documents live in .opencode/context/library/ as markdown with frontmatter.",
  "ingest stores markdown the agent fetched with ax (or an MCP) — the tool never performs HTTP.",
  "get returns frontmatter+summary, or one part; list/search are metadata/full-text only (semantic retrieval stays with graphQuery).",
  "annotate appends to the page's Local notes; refresh bumps revision or dedupes by hash; prune archives stale pages; migrate normalises old research captures.",
].join(" ")

export function registerLibraryTool(editor: any, directory: string | undefined) {
  editor.add({
    name: "hubDocs",
    options: { codemode: false },
    description: DESCRIPTION,
    input: INPUT,
    async execute(input: any) {
      try {
        switch (input.action) {
          case "ingest":
            return { content: JSON.stringify(ingest({ ...input, directory })) }
          case "get":
            return { content: JSON.stringify(get(directory, input)) }
          case "list":
            return { content: JSON.stringify(list(directory, input)) }
          case "search":
            return { content: JSON.stringify(search(directory, input)) }
          case "annotate":
            return { content: JSON.stringify(annotate(directory, input)) }
          case "refresh":
            return { content: JSON.stringify(refresh(directory, input)) }
          case "prune":
            return { content: JSON.stringify(prune(directory, input)) }
          case "migrate":
            return { content: JSON.stringify(migrate(directory, input)) }
          default:
            return { content: JSON.stringify({ error: `Unknown action: ${input.action}` }) }
        }
      } catch (error) {
        return { content: JSON.stringify({ error: error instanceof Error ? error.message : String(error) }) }
      }
    },
  })
}
