---
name: hubs-setup
description: Install or refresh OpenCode Hubs — delegates to /init-project for the full workflow
level: 2
license: MIT
---

# Hubs Setup

This skill has been consolidated into `/init-project`. It now serves as a backward-compatible entrypoint.

**When this skill is invoked, immediately execute the routing below. Do not only restate or summarize these instructions back to the user.**

## Routing

Translate the invocation to the equivalent `/init-project` call:

| Hubs Setup Flag | Maps To |
|----------------|---------|
| No flags | `/init-project` (full wizard) |
| `--local` | `/init-project --minimal` |
| `--global` | `/init-project` (Phase 0 + full project setup) |
| `--force` | `/init-project --force` |
| `--help` | `/init-project --help` |

## Migrating a project to OpenCode 2

`/hub-setup migrate-v2` runs the migration script in this skill's `scripts/` directory:

```bash
bun ~/.config/opencode/skills/hubs-setup/scripts/migrate-v2.ts --project <dir> [--dry-run] [--v2-native] [--force] [--json]
```

It rewrites `.opencode/tools/*.ts` into `.opencode/plugins/<name>/index.ts` (OpenCode 2 removed file-based tool discovery, so a V1 tool file is inert), drops config plugin entries that point at a file, and — with `--v2-native` — rewrites the `permission` map, `mcp` map, and `skills` object into the native V2 shape.

A V1 hook plugin is reported, not rewritten: V2 dropped the hook map, so each hook moved to its own domain (`ctx.event.subscribe`, `ctx.tool.hook`, `ctx.session.hook`, `ctx.permission.hook`). The mapping table is in `plugins/hooks/index.ts` in the global config.

The `/init-project` skill handles:
- Global Hubs verification (Phase 0) — replaces hubs-setup's install flow
- Project scaffolding (Phase 3) — replaces hubs-setup's config generation
- Documentation (Phase 4) — replaces `/deepinit`
- Context capture and routing — new capabilities

## Migration Notice

For backward compatibility, `/hubs-setup` still works. For new projects, prefer `/init-project` which covers global config, project setup, docs, and context in one command.