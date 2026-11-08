import { describe, expect, test } from "vitest"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

import { registerLibraryTool } from "../../plugins/hubs/tools/library/index"
import { annotate, get, ingest, list, migrate, prune, refresh, search } from "../../plugins/hubs/tools/library/store"
import { parseDocument } from "../../plugins/hubs/tools/library/schema"

function temp(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hub-library-"))
  fs.mkdirSync(path.join(dir, ".opencode", "context"), { recursive: true })
  return dir
}

const DOC = `# Widget API

Create and manage widgets.

## Install

\`\`\`bash
npm i widgets
\`\`\`

## Create a widget

Call \`widgets.create({ name })\`.

## Errors

A 409 means the widget already exists.
`

describe("ingest and get", () => {
  test("writes a document page with frontmatter, summary and a log line", () => {
    const dir = temp()
    const result = ingest({
      directory: dir,
      url: "https://docs.example.com/widgets",
      markdown: DOC,
      collection: "example",
      source_type: "official",
      tags: ["widgets", "api"],
    })

    expect(result.deduped).toBe(false)
    expect(result.revision).toBe(1)
    const file = path.join(dir, ".opencode/context/library/example", `${result.id.split("/")[1]}.md`)
    expect(fs.existsSync(file)).toBe(true)

    const { data, body } = parseDocument(fs.readFileSync(file, "utf-8"))
    expect(data.type).toBe("document")
    expect(data.collection).toBe("example")
    expect(data.source_url).toBe("https://docs.example.com/widgets")
    expect(data.summary).toContain("Create and manage widgets")
    expect(data.license).toBeUndefined()
    expect(body).toContain("## Create a widget")

    const log = fs.readFileSync(path.join(dir, ".opencode/context/log.md"), "utf-8")
    expect(log).toContain("library | ingest")

    const page = get(dir, { id: result.id })
    expect(page.body).toContain("## Errors")
  })

  test("dedupes identical content and bumps revision on change", () => {
    const dir = temp()
    const first = ingest({ directory: dir, url: "https://x/1", markdown: DOC, collection: "x" })
    const again = ingest({ directory: dir, url: "https://x/1", markdown: DOC, collection: "x" })
    expect(again.deduped).toBe(true)
    expect(again.revision).toBe(1)

    const changed = ingest({ directory: dir, url: "https://x/1", markdown: `${DOC}\n## Extra\n\nMore.\n`, collection: "x" })
    expect(changed.deduped).toBe(false)
    expect(changed.revision).toBe(2)
  })

  test("stores operational content unchanged — no content gate", () => {
    const dir = temp()
    const payload = "# Pentest notes\n\n## Bypass\n\ncurl-style payload: ' OR 1=1 -- ; rm -rf /tmp/nothing\n"
    const result = ingest({ directory: dir, url: "https://internal/pentest", markdown: payload, collection: "internal", source_type: "first-party" })
    const page = get(dir, { id: result.id })
    expect(page.body).toContain("' OR 1=1 --")
    expect(page.body).toContain("rm -rf /tmp/nothing")
  })
})

describe("notes and refresh", () => {
  test("annotate appends Local notes and refresh preserves them", () => {
    const dir = temp()
    const result = ingest({ directory: dir, url: "https://x/notes", markdown: DOC, collection: "x" })
    annotate(dir, { id: result.id, note: "Needs raw body for webhooks" })
    expect(get(dir, { id: result.id }).body).toContain("Needs raw body for webhooks")

    refresh(dir, { id: result.id, markdown: `${DOC}\n## New\n\nFresh.\n` })
    const page = get(dir, { id: result.id })
    expect(page.frontmatter.revision).toBe(2)
    expect(page.body).toContain("## New")
    expect(page.body).toContain("Needs raw body for webhooks")
  })
})

describe("splitting", () => {
  test("splits a large document at H2 and reads a part on demand", () => {
    const dir = temp()
    const section = (n: number) => `## Section ${n}\n\n${"lorem ipsum ".repeat(900)}\n`
    const body = `# Big\n\nIntro.\n\n${Array.from({ length: 8 }, (_, i) => section(i + 1)).join("\n")}`
    const result = ingest({ directory: dir, url: "https://x/big", markdown: body, collection: "x" })
    expect(result.parts).toBeGreaterThan(1)

    const page = get(dir, { id: result.id })
    expect(page.body).toContain("## Contents")
    const part = get(dir, { id: result.id, part: 1 })
    expect(part.body).toContain("## Section 1")
  })
})

describe("list, search, prune", () => {
  test("filters by collection/tag and detects stale pages", () => {
    const dir = temp()
    ingest({ directory: dir, url: "https://x/a", markdown: DOC, collection: "x", tags: ["alpha"] })
    ingest({ directory: dir, url: "https://y/b", markdown: DOC, collection: "y", retrieved_at: "2020-01-01" })
    expect(list(dir, { collection: "x" })).toHaveLength(1)
    expect(list(dir, { tag: "alpha" })).toHaveLength(1)
    expect(list(dir, { stale: true }).length).toBeGreaterThan(0)
  })

  test("search ranks title and body matches", () => {
    const dir = temp()
    ingest({ directory: dir, url: "https://x/widget", markdown: DOC, collection: "x" })
    const hits = search(dir, { query: "widget" })
    expect(hits.length).toBeGreaterThan(0)
    expect(hits[0]!.headings.length + hits[0]!.score).toBeGreaterThan(0)
  })

  test("prune archives stale pages and dry-run changes nothing", () => {
    const dir = temp()
    const result = ingest({ directory: dir, url: "https://x/old", markdown: DOC, collection: "x", retrieved_at: "2020-01-01" })
    const dry = prune(dir, { dry_run: true })
    expect(dry.stale).toContain(result.id)
    expect(list(dir)).toHaveLength(1)

    const run = prune(dir)
    expect(run.archived).toContain(result.id)
    expect(list(dir)).toHaveLength(0)
    expect(fs.existsSync(path.join(dir, ".opencode/context/library/archive", `${result.id}.md`))).toBe(true)
  })
})

describe("migrate", () => {
  test("normalises a single-source research page in a second pass", () => {
    const dir = temp()
    const page = path.join(dir, ".opencode/context/research/example.md")
    fs.mkdirSync(path.dirname(page), { recursive: true })
    fs.writeFileSync(page, `---\ntitle: "Example"\ntype: source-summary\ntags: [a]\nsources: ["https://docs.example.com/x"]\nstatus: active\n---\n\n# Example\n\nBody.\n`)

    const dry = migrate(dir, { dry_run: true })
    expect(dry.changes).toHaveLength(1)
    expect(parseDocument(fs.readFileSync(page, "utf-8")).data.type).toBe("source-summary")

    migrate(dir)
    const { data } = parseDocument(fs.readFileSync(page, "utf-8"))
    expect(data.type).toBe("document")
    expect(data.source_url).toBe("https://docs.example.com/x")
    expect(data.collection).toBe("example")
  })
})

describe("tool registration", () => {
  test("registers hubDocs with codemode off and dispatches actions", async () => {
    const dir = temp()
    const added: any[] = []
    const editor = { add: (tool: any) => added.push(tool) }
    registerLibraryTool(editor, dir)
    expect(added).toHaveLength(1)
    expect(added[0].name).toBe("hubDocs")
    expect(added[0].options.codemode).toBe(false)

    const result = await added[0].execute({ action: "list" })
    expect(JSON.parse(result.content)).toEqual([])
  })
})
