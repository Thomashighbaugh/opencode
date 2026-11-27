# Feature Requests

Missing capabilities this project's `.opencode/` config should provide.
Promoted to `provision` when Recurrence-Count >= 3.

---

## FEAT-20261003-000001 — Auto-rebuild TUI menu bundle on spec/skill change
- **Type**: config
- **Pattern-Key**: `tui-bundle-stale-after-spec-change`
- **Recurrence-Count**: 3
- **Status**: promoted
- **Priority**: high
- **Source**: conversation
- **Area**: `plugins/hubs-tui/`, `command-hooks.jsonc`, `rules/hub-menu-rebuild.md`
- **Logged**: 2026-10-03
- **Why it will matter later**: the TUI dialog is the primary way subcommands are discovered. A
  committed spec with a stale bundle means a working subcommand is *invisible* — the user cannot
  select what they cannot see, and no error is raised anywhere. This has already shipped broken twice.
- **Summary**: The bundle rebuild is a documented manual step (`rules/hub-menu-rebuild.md`) that has
  been skipped at least twice in history and patched after the fact:
  - `79280b0` — `fix: regenerate TUI hub menus — missing graph, self-improve, delegate, insights`
    (4 subcommands invisible in the dialog)
  - `5ae6d27` — `chore(hubs): regenerate spec registry and TUI menu bundle`
  - `61f8c5c` — the rule itself was written *because* the miss happened

  The bundle is currently fresh (`generated-hubs.ts` and `dist/tui.js` both 2026-09-30, newest spec
  file also 2026-09-30), so nothing is stale right now. The gap is that nothing enforces it.
- **Reproduce clues**: edit any `tools/hubs/<hub>/<sub>.ts`; the new subcommand does not appear in the
  `/hub` dialog until `bun run generate-menus && bun build src/tui.tsx` is run by hand.
- **Fix direction**: a `command-hooks.jsonc` hook on write to `tools/hubs/**/*.ts` and
  `skills/*/SKILL.md` that runs `generate-menus` and rebuilds `dist/tui.js`. `command-hooks.jsonc`
  and a `command-hooks` plugin already exist, so this is a config addition, not new infrastructure.
- **Promotion gate**: **MET** — Recurrence-Count 3, 2+ distinct tasks, verified before/after evidence
  from commit history.
- **Promoted into**: `command-hooks.jsonc` as `hub-menu-rebuild-after-write`, firing on writes to
  `tools/hubs/**/*.ts`, `tools/hub-*.ts`, and `skills/*/SKILL.md`. `rules/hub-menu-rebuild.md` now
  documents a step the system performs rather than one it asks you to remember.
- **Evidence**: the hook's exact command was executed end-to-end — `bun run generate-menus && bun
  build src/tui.tsx --outdir dist --target bun --minify`, exit 0, both `src/generated-hubs.ts` and
  `dist/tui.js` rewritten.
- **See Also**: ERR-20261003-000001 (both are gates that should fire but do not)
---

## FEAT-20261126-000001 - typecheck noise from bun:test ambient types and skill-script implicit any
- **Type**: config
- **Pattern-Key**: `typecheck-noise-bun-test-skill-scripts`
- **Recurrence-Count**: 1
- **Status**: fixed
- **Priority**: medium
- **Source**: conversation
- **Area**: tsconfig.json, plugins/*/test/*.test.ts, skills/graph-context/scripts/graphlib.ts, skills/vectorize-context/scripts/veclib.ts
- **Logged**: 2026-11-26
- **Why it will matter later**: a noisy `tsc --noEmit` hides real errors. With roughly 160 known-noise diagnostics, a genuine type regression in the plugin surface is easy to miss.
- **Summary**: 8 `TS2307 Cannot find module 'bun:test'` (no ambient types) and about 154 implicit-`any` diagnostics in the two runtime skill scripts. The user asked to fix this; the work was preempted by the commit and security-alert request and remains open.
- **Reproduce clues**: `npx tsc --noEmit | grep -c 'bun:test'` -> 8; `npx tsc --noEmit | grep -c "implicitly has an 'any'"` -> large.
- **Fix direction**: add a small `bun-test.d.ts` ambient declaration (or `@types/bun`), and either annotate the two scripts' parameters or add `// @ts-nocheck` to those standalone runtime scripts. Keep plugin source strictly typed.
- **Fix applied** (2026-11-26): added `tests/bun-test.d.ts` (ambient `bun:test` module) and `// @ts-nocheck` after the shebang in `graphlib.ts` and `veclib.ts`. Plugin source stays strictly typed.
- **Evidence**: before, `npx tsc --noEmit` emitted ~162 diagnostics; after, it exits 0 with no output. 1185 vitest and 226 bun tests still pass.
