/**
 * regen-index.ts — rebuild `.opencode/context/index.md` from the pages on disk.
 *
 * The catalog is supposed to be auto-maintained (see wiki-schema.md). It had
 * drifted: 69 entries, of which 36 named pages that do not exist, because the
 * research pages moved into dated subdirectories and the slugs were never
 * updated. Rebuilding it from the filesystem is the fix that stays fixed — a
 * hand-patched entry only re-breaks on the next move.
 *
 * A page's slug is its path relative to `.opencode/` without the `.md`, which is
 * exactly how the graph keys those nodes, so every link it emits resolves.
 *
 * Run: npx tsx skills/graph-context/scripts/regen-index.ts
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as yaml from 'js-yaml'
import { fileURLToPath } from 'node:url'
import * as pathModule from 'node:path'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const OPENCODE_DIR = path.resolve(HERE, '..', '..', '..', '.opencode')
const CONTEXT_DIR = path.join(OPENCODE_DIR, 'context')

interface Page {
  slug: string
  rel: string
  title: string
  type: string
  tags: string
  status: string
  section: string
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(p, out)
    else if (entry.name.endsWith('.md')) out.push(p)
  }
  return out
}

function sectionFor(rel: string): string {
  if (rel.startsWith('context/research/')) return 'Research (External Sources)'
  if (rel.startsWith('context/frameworks/')) return 'Frameworks (Architecture & Design)'
  if (rel.startsWith('context/patterns/')) return 'Patterns & Practices'
  if (rel.includes('/sessions/')) return 'Sessions'
  if (rel.includes('/docs/')) return 'Docs'
  return 'Top Level'
}

export function collectPages(): Page[] {
  const pages: Page[] = []
  for (const file of walk(CONTEXT_DIR)) {
    const rel = path.relative(OPENCODE_DIR, file).split(path.sep).join('/')
    const text = fs.readFileSync(file, 'utf-8')
    const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)
    let fm: Record<string, any> = {}
    if (m) {
      try {
        fm = (yaml.load(m[1]) as Record<string, any>) ?? {}
      } catch {
        // A page with malformed frontmatter still gets catalogued; only its
        // metadata degrades to the placeholder.
        fm = {}
      }
    }
    pages.push({
      slug: rel.replace(/\.md$/, ''),
      rel,
      title: String(fm.title ?? path.basename(file, '.md')),
      type: String(fm.type ?? '—'),
      tags: Array.isArray(fm.tags) ? fm.tags.join(', ') : String(fm.tags ?? '—'),
      status: String(fm.status ?? '—'),
      section: sectionFor(rel),
    })
  }
  return pages
}

const ORDER = [
  'Research (External Sources)',
  'Frameworks (Architecture & Design)',
  'Patterns & Practices',
  'Docs',
  'Sessions',
  'Top Level',
]

export function renderIndex(pages: Page[], today: string): string {
  const out: string[] = [
    '---',
    'title: "LLM Wiki Index"',
    'type: concept',
    'tags: [wiki, index, catalog]',
    'created: 2026-07-04',
    `updated: ${today}`,
    'status: active',
    '---',
    '',
    '# LLM Wiki Index',
    '',
    'Auto-maintained catalog, regenerated from the files on disk by',
    '`skills/graph-context/scripts/regen-index.ts`.',
    '',
    'Every `[[slug]]` below resolves to a real page. A slug is the page path',
    'relative to `.opencode/` without the `.md` extension, which is how the graph',
    'keys the same nodes — so a link here and a graph edge resolve identically.',
    '',
    '## Regenerating',
    '',
    '```bash',
    'npx tsx skills/graph-context/scripts/regen-index.ts',
    'npx tsx skills/graph-context/scripts/graph.ts build',
    '```',
    '',
    '`graph.ts build` reports `skippedLinks` in its wiki stats. A non-zero count',
    'means some link in this tree names a page that does not exist — that is the',
    'check that stops this file drifting again.',
    '',
  ]

  for (const section of ORDER) {
    const items = pages.filter((p) => p.section === section).sort((a, b) => a.slug.localeCompare(b.slug))
    if (!items.length) continue
    out.push(`## ${section}`, '')
    out.push('| Page | Type | Tags | Status |')
    out.push('|------|------|------|--------|')
    for (const p of items) {
      // index.md and log.md are the catalog and the log itself, not pages to
      // link to — a self-link is noise, and log.md's entries are append-only.
      const label = p.slug === 'context/index' ? '`index.md` (this file)' : `[[${p.slug}]]`
      out.push(`| ${label} | ${p.type} | ${p.tags} | ${p.status} |`)
    }
    out.push('')
  }
  return out.join('\n')
}

// ESM has no `require.main`; compare against the invoked path instead.
const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invokedDirectly) {
  const pages = collectPages()
  const today = new Date().toISOString().slice(0, 10)
  fs.writeFileSync(path.join(CONTEXT_DIR, 'index.md'), renderIndex(pages, today))
  const bySection = new Map<string, number>()
  for (const p of pages) bySection.set(p.section, (bySection.get(p.section) ?? 0) + 1)
  console.log(`index.md regenerated: ${pages.length} pages`)
  for (const [k, v] of bySection) console.log(`  ${v.toString().padStart(3)}  ${k}`)
}
