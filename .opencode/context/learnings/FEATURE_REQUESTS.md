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