---
name: joc-setup
description: Install or refresh OpenCode JOC — delegates to /init-project for the full workflow
level: 2
---

# JOC Setup

This skill has been consolidated into `/init-project`. It now serves as a backward-compatible entrypoint.

**When this skill is invoked, immediately execute the routing below. Do not only restate or summarize these instructions back to the user.**

## Routing

Translate the invocation to the equivalent `/init-project` call:

| JOC Setup Flag | Maps To |
|----------------|---------|
| No flags | `/init-project` (full wizard) |
| `--local` | `/init-project --minimal` |
| `--global` | `/init-project` (Phase 0 + full project setup) |
| `--force` | `/init-project --force` |
| `--help` | `/init-project --help` |

The `/init-project` skill handles:
- Global JOC verification (Phase 0) — replaces joc-setup's install flow
- Project scaffolding (Phase 3) — replaces joc-setup's config generation
- Documentation (Phase 4) — replaces `/deepinit`
- Context capture and routing — new capabilities

## Migration Notice

For backward compatibility, `/joc-setup` still works. For new projects, prefer `/init-project` which covers global config, project setup, docs, and context in one command.