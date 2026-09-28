# Hub Menu Rebuild Rule

**Adding a new hub subcommand (or changing subcommand metadata) requires rebuilding the TUI menu.** Source manifests alone are not enough — the TUI plugin serves a generated bundle that goes stale.

## The Problem

The TUI hub menus (`/git-hub`, `/orchestrate-hub`, etc.) are rendered from a **generated** bundle in `plugins/hubs-tui/`, NOT from the canonical hub manifests (`tools/hubs/<hub>/index.ts`). When a new subcommand is added (e.g. `/resource-hub knowledge-graph`) and only the manifests + spec-registry are committed, the subcommand is **invisible in the TUI dialog** until the bundle is regenerated.

## The Rule

After adding, removing, or renaming any hub subcommand — and after changing any `description` or `label` in a spec file — run:

```bash
cd plugins/hubs-tui && bun run generate-menus && bun build src/tui.tsx --outdir dist --target bun --minify
```

- `bun run generate-menus` → regenerates `src/generated-hubs.ts` from `../../tools/hub-*.ts` manifests (this file IS committed)
- `bun build` → regenerates `dist/tui.js` (gitignored — rebuilt locally, not committed)

## Verification

After regeneration, confirm the subcommand is present in the generated source:

```bash
grep '"label": "graph"' plugins/hubs-tui/src/generated-hubs.ts
```

And the project hub block in the dist bundle:

```bash
node -e "
const src = require('fs').readFileSync('plugins/hubs-tui/dist/tui.js','utf8');
const m = src.match(/name:\"project\"[\s\S]*?subs:\[(.*?)\]\},\{name:\"skills\"/);
console.log([...m[1].matchAll(/label:\"([^\"]+)\"/g)].map(x=>x[1]).slice(-5));
"
```

## Enforcement

- **Any change to `tools/hubs/<hub>/<subcommand>.ts`** (new file, label, or description) triggers the rebuild requirement
- **Commit the regenerated `src/generated-hubs.ts`** alongside the manifest change
- The user must **reload OpenCode** after the fix — the TUI plugin loads `dist/tui.js` at startup

## Example

Adding `/resource-hub knowledge-graph` required:
1. `tools/hubs/project/graph.ts` + registration in `tools/hubs/project/index.ts`
2. `npx tsx tools/build-spec-registry.ts` (spec registry)
3. `rules/hub-routing.md` + `AGENTS.md` routing rows
4. **`cd plugins/hubs-tui && bun run generate-menus && bun build src/tui.tsx --outdir dist --target bun --minify`** ← the step that was missed
5. Commit both the manifest and the regenerated `plugins/hubs-tui/src/generated-hubs.ts`
