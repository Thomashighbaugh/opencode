<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-01 | Updated: 2026-05-01 -->

# hubs-tui

## Purpose
TUI (Terminal User Interface) plugin for OpenCode Hubs. Provides native DialogSelect menus for hub command palettes, visual hub dialogs, and interactive terminal interfaces.

## Key Files

| File | Description |
|------|-------------|
| `index.js` | Plugin entry point |
| `package.json` | Package manifest and dependencies |
| `hubs-tui-hubs-0.1.0.tgz` | Packaged distribution archive |
| `bun.lock` | Bun lockfile for dependency resolution |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `src/` | Source code (TypeScript/TSX) — see `src/tui.tsx` |
| `dist/` | Compiled distribution output (gitignored/regenerated) |

## For AI Agents

### Working In This Directory
- This is an NPM plugin package consumed by the OpenCode plugin system
- Registered in `opencode.jsonc` as `hubs-tui-hubs@0.1.0`
- `dist/` is a build artifact — modify `src/` instead
- The TUI uses React-like TSX components rendered in the terminal

### Testing Requirements
- Build verification: `bun run build` (check `package.json` scripts)
- Plugin loading verified by `btw_status` tool
- Visual testing done via OpenCode TUI runtime

### Common Patterns
- TSX component files in `src/`
- Plugin adheres to OpenCode TUI plugin API

## Dependencies

### Internal
- `plugins/hubs-plugin.ts` — Hook system plugin (sibling)
- `tools/hubMenu.ts` — Hub menu routing data source

### External
- OpenCode TUI plugin API
- Bun runtime

<!-- MANUAL: -->
