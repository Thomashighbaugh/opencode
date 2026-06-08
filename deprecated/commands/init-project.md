---
description: "Initialize or refine project setup — global Hubs config, project .opencode/, hierarchical docs, and context capture in one pass"
invoke: init-project
argument-hint: "[setup|detect|docs|context|verify|refresh] [--flags]"
---

# Init Project

Unified project initialization hub. Set up, detect, document, or refine an OpenCode Hubs project through focused subcommands. Replaces `/hubs-setup`, `/deepinit`, and `/init-project-config`.

## Behavior

### With Arguments

Directly invoke the matching subcommand. Skip the menu.

### Without Arguments

Use the `hubMenu` tool with `action: "menu"` and `hub: "init-project"` to get the interactive menu JSON, then pass the result to the `question` tool to present it. This avoids manually encoding the menu — the tool provides it from a single source of truth.

After the user selects, invoke the `init-project` skill with the selected subcommand (plus any flags the user provides).

## Subcommand Delegation

| Selection | Phases | What It Does |
|-----------|--------|--------------|
| `setup` | 0-7 | Full project initialization from scratch — verify global, detect, plan, scaffold, document, capture context, optimize routing, validate |
| `detect` | 0-1 | Verify global Hubs and detect language, framework, package manager, build system, key directories, CI |
| `docs` | 4 | Regenerate hierarchical AGENTS.md documentation across the codebase (equivalent to `/deepinit`) |
| `context` | 5 | Capture session knowledge and promote insights to project memory, notepad, and AGENTS.md |
| `verify` | 7 | Validate all generated files, config syntax, parent references, and gitignore |
| `refresh` | 0-7 (merge) | Update existing configuration, preserving `<!-- MANUAL -->` sections and user customizations |
| `status` | — | List state files in `.opencode/state/` and show last checkpoint |

## Flag Compatibility

Flags still work as before and modify subcommand behavior:

| Flag | Effect |
|------|--------|
| `--minimal` | Essential files only (phases 0-3, no docs) |
| `--full` | Everything including context capture and routing (phases 0-7) |
| `--force` | Skip "already exists" checks |
| `--language <lang>` | Force language, skip detection phase |
| `--no-detect` | Use generic defaults |
| `--no-docs` | Skip Phase 4 even in full mode |

Flags can be combined with subcommands:

```
/init-project setup --full
/init-project refresh --force
/init-project detect --language rust
/init-project docs
```

## Task

Invoke the `init-project` skill with: `$ARGUMENTS`