---
title: "OpenLoops — Persistent Loop and Workflow Runner"
type: source-summary
tags: [loops, scheduler, daemon, agents, opencode, cli, workflow]
created: 2026-07-04
updated: 2026-07-04
sources: [npm-registry, github-readme]
status: active
---

# OpenLoops (@hasna/loops)

**OpenLoops** is a local CLI and daemon for persistent loops and workflows: scheduled or recurring work that survives process restarts and records every run.

- **Package**: `@hasna/loops` on npm
- **Repository**: [hasna/loops](https://github.com/hasna/loops)
- **License**: Apache-2.0
- **Runtime**: Requires Bun >= 1.0 (not Node.js)
- **Latest Version**: 0.4.9

## Binaries

| Binary | Purpose |
|--------|---------|
| `loops` | Main CLI |
| `loops-daemon` | Background daemon for scheduled work |
| `loops-api` | Self-hosted control plane API |
| `loops-runner` | One-shot runner for embedded hosts |
| `loops-mcp` | MCP server for safe loop/workflow inspection |

## Deployment Modes

| Mode | Description |
|------|-------------|
| **local** (default) | SQLite in `LOOPS_DATA_DIR` is authoritative; `loops-daemon` executes scheduled work. No network, token, or hosted service needed. |
| **self_hosted** | User-operated `loops-api` control plane. Exposes CRUD, run listing, runner claim/heartbeat/finalize protocol, export/import. |
| **cloud** | Hosted control-plane contract. Auth and infrastructure live outside this package. |

Set via `LOOPS_MODE` or `HASNA_LOPS_MODE` env var.

## Install

```bash
npm install -g @hasna/loops
loops --version
```

Update and restart daemon:

```bash
npm update -g @hasna/loops
loops daemon stop && loops daemon start
```

## MCP Server

Ships a stdio MCP server for safe inspection from MCP-capable agents:

```bash
loops-mcp list-tools
loops-mcp
```

Read tools: `loops_list`, `loops_show`, `loops_runs`, `loops_doctor`, `loops_workflows_list`, `loops_workflow_read`, `loops_workflow_validate`.

Mutation tools (disabled by default, enable with `LOOPS_MCP_ALLOW_MUTATIONS=true`): `loops_pause`, `loops_resume`, `loops_stop`, `loops_run_now`, `loops_archive`, `loops_unarchive`, `loops_create_command`, `loops_create_workflow`.

## Creating Loops

**Command loop** — run a deterministic command every minute:
```bash
loops create command repo-status --every 1m --cmd "git status --short" --cwd /path/to/repo
```

**Agent loop** — run an AI agent on a schedule:
```bash
loops create agent morning-check \
  --provider claude \
  --cron "0 8 * * *" \
  --cwd /path/to/repo \
  --prompt "Check whether this repo is healthy and summarize required action."
```

**Supported agent providers**: `claude`, `agent` (Cursor), `codewith`, `aicopilot`, `opencode`, `codex`.

**Prompt files** — use files instead of inline strings for production prompts:
```bash
loops create agent morning-check \
  --provider codewith \
  --prompt-file ~/.hasna/loops/prompts/repo-morning-check.md
```

## Goals

Wrap a command, agent, or workflow loop in an AI-SDK orchestration layer. OpenLoops asks the configured model to create a flat DAG plan, then executes ready plan nodes. An adversarial achievement audit runs before the goal is marked complete.

```bash
loops create agent repo-fixer \
  --provider codex \
  --prompt "Work only on the requested repository task." \
  --goal "Fix the failing lint check and prove it with a passing lint run." \
  --goal-budget 2000 \
  --goal-model openai/gpt-4o-mini \
  --goal-max-turns 5
```

Uses Vercel AI SDK with `@openrouter/ai-sdk-provider`. Requires `OPENROUTER_API_KEY`.

## Workflows

Define multi-step workflows in JSON with dependency ordering:

```json
{
  "name": "repo-morning",
  "steps": [
    {
      "id": "status",
      "target": {
        "type": "command",
        "command": "git",
        "args": ["status", "--short"],
        "cwd": "/path/to/repo"
      }
    },
    {
      "id": "review",
      "dependsOn": ["status"],
      "target": {
        "type": "agent",
        "provider": "codex",
        "cwd": "/path/to/repo",
        "prompt": "Review the repository status and summarize concrete next actions."
      }
    }
  ]
}
```

Commands:
```bash
loops workflows validate repo-morning.json
loops workflows create repo-morning.json
loops workflows run repo-morning --show-output
loops create workflow repo-morning-loop --workflow repo-morning --cron "0 8 * * *"
```

## Templates

Built-in templates for common orchestration flows: `todos-task-worker-verifier`, `event-worker-verifier`, `bounded-agent-worker-verifier`, `task-lifecycle`, `pr-review`, `scheduled-audit`, `knowledge-refresh`, `report-only`, `incident-response`, `deterministic-check-create-task`.

Custom templates live in `~/.hasna/loops/templates/`.

## Task Event Routing

For event-driven task automation, `loops routes create todos-task` reads a Hasna event envelope, records a `WorkflowInvocation`, upserts an admission work item, and admits it into a deduped one-shot workflow loop.

```bash
cat task-created-event.json | loops routes create todos-task \
  --template task-lifecycle \
  --provider codewith \
  --auth-profile-pool account001,account002,account003
```

## Scheduling Contract

- `once`: one run at an absolute date/time
- `interval`: fixed-rate, next slot based on scheduled slot, advanced past completion
- `cron`: five-field cron expression, host local timezone
- `dynamic`: one-minute cadence, no backfill
- `catch_up`: `latest` (default), `all`, or `none`
- `overlap`: `skip` (default) — due slot records skipped run if previous still active
- Failed slots retry only when `--attempts > 1`

## Daemon Management

```bash
loops daemon start|stop|status|logs|run
loops doctor
loops daemon install  # systemd (Linux) or LaunchAgent (macOS)
```

## Health & Hygiene

```bash
loops health --json
loops expectations <loop-id-or-name> --json
loops hygiene names|duplicates|scripts --json
```

## OpenAutomations Runtime Binding

OpenLoops can serve as an execution runtime for OpenAutomations product automations. The SDK exposes `openAutomationsRuntimeBinding()` for the claim-queue handoff protocol.

## Key Concepts

- **Loops**: Scheduled or recurring work items (command or agent)
- **Workflows**: Multi-step DAGs with dependency ordering
- **Goals**: AI-orchestrated plan-execute-verify loops wrapping any target
- **Templates**: Reusable workflow JSON blueprints
- **Routes**: Event-driven task automation pipelines
- **MCP Server**: Safe read-only (or opt-in mutation) access from AI agents
