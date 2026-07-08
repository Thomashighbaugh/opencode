---
title: "opencode-memoir — OpenCode Plugin for Memoir (Git-Versioned Memory)"
type: source-summary
tags: [opencode, plugin, memory, memoir, mcp, git, versioned-memory]
created: 2026-07-07
updated: 2026-07-07
sources: [github-readme]
status: active
---

# opencode-memoir

OpenCode plugin for [Memoir](https://github.com/zhangfengcdt/memoir): git-versioned, taxonomy-structured memory for coding agents. Dynamically loads `memoir-mcp` MCP server via `uvx` — no manual CLI install.

## Install

Add to `~/.config/opencode/opencode.jsonc`:

```jsonc
{
  "plugin": ["opencode-memoir"]
}
```

OpenCode auto-resolves from npm. Pin version: `"opencode-memoir@1.0.0"`.

## Quick Start

1. Install plugin
2. Agent auto-gets `memoir_memoir_recall`, `memoir_memoir_remember`, `memoir_memoir_get` MCP tools

## Store Config

Override via `MEMOIR_STORE` env var or plugin option:

```jsonc
{
  "plugin": [
    ["opencode-memoir", { "store": "/custom/store/path" }]
  ]
}
```

## Env Vars

| Var | Effect |
|-----|--------|
| `MEMOIR_STORE` | Override store path (passed to memoir-mcp as `--store`) |
| `MEMOIR_DEBUG=1` | Diagnostic stderr logs (`[memoir]` prefix) |
| `MEMOIR_AUTO_SAVE=1` | Auto-save session marker on dispose (default: off) |
| `MEMOIR_REMINDER_INTERVAL=N` | Periodic save/recall reminder every N messages (default: 5, 0=off) |

## Hooks

| Hook | Purpose |
|------|---------|
| `config` | Registers `memoir-mcp` dynamic MCP server; adds `/memoir:onboard` slash command |
| `shell.env` | Injects `MEMOIR_STORE` into shell env |
| `chat.message` | Message counter; auto-match memoir branch to current git branch |
| `experimental.chat.system.transform` | Startup hint (once/session); periodic save/recall reminder |
| `dispose` | Optionally save session marker; clear pending state |

## How It Works

Registers `memoir-mcp` as dynamic MCP server via `uvx --from memoir-ai[mcp] memoir-mcp`. All memoir tools available natively to LLM — no TypeScript tool re-implementation.

## Source Layout

| File | Responsibility |
|------|---------------|
| `src/index.ts` | Plugin entry: MCP registration + all hooks + dispose |
| `src/store.ts` | Store path derivation, branch auto-match, `callMemoir` CLI helper |
| `src/memory-saver.ts` | Per-session message counter for periodic reminders |
| `src/debug.ts` | Conditional stderr logger (`MEMOIR_DEBUG=1`) |

## Publishing

Fully automated via semantic-release. Conventional Commits on `main` → auto-tag → `npm publish --provenance`.
