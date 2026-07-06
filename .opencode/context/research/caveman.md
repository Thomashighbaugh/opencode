---
title: "Caveman — Ultra-Compressed Communication Skill for AI Coding Agents"
type: source-summary
tags: [opencode, claude-code, codex, gemini, skill, compression, tokens, caveman, prompt-engineering]
created: 2026-07-05
updated: 2026-07-05
sources: [github-readme]
status: active
---

# Caveman (JuliusBrussee/caveman)

**Why use many token when few token do trick** — a skill/plugin that cuts ~65% of output tokens by making AI coding agents talk like cavemen, while preserving technical accuracy.

- **Repository**: [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman) (84.1k ⭐, 4.7k forks)
- **License**: MIT
- **Latest**: v1.9.1 (Jul 3, 2026)
- **Website**: [caveman.so](https://caveman.so)
- **Privacy**: No telemetry, no analytics, no accounts, no backend. Zero network calls after install.
- **Sponsor**: Atlas Cloud

## Quick Install

```bash
# macOS · Linux · WSL · Git Bash
curl -fsSL https://raw.githubusercontent.com/JuliusBrussee/caveman/main/install.sh | bash

# Windows · PowerShell 5.1+
irm https://raw.githubusercontent.com/JuliusBrussee/caveman/main/install.ps1 | iex
```

~30 seconds. Needs Node ≥18. Auto-detects every agent on your machine and installs for each.

## Supported Agents

Works with 30+ agents including: Claude Code, Codex, Gemini CLI, Cursor, Windsurf, Cline, Copilot, OpenCode, and more. Full per-agent matrix in [INSTALL.md](https://github.com/JuliusBrussee/caveman/blob/main/INSTALL.md).

## Compression Levels

| Level | Description | Same sentence, shrunk |
|-------|-------------|----------------------|
| `lite` | Light compression | *Wrap object in `useMemo`. New ref created every render.* |
| `full` (default) | Standard caveman | *New ref each render. Wrap object in `useMemo`. |
| `ultra` | Maximum compression | *New ref/render. `useMemo` it.* |
| `wenyan` | Classical Chinese | *New ref every render, so wrap in `useMemo` — rendered in classical Chinese* |

Switch anytime with `/caveman <level>`. Level sticks for the session.

## Commands

| Command | Description |
|---------|-------------|
| `/caveman [lite\|full\|ultra\|wenyan]` | Compress every reply |
| `/caveman-commit` | Conventional Commit messages, ≤50-char subject |
| `/caveman-review` | One-line PR comments: `L42: 🔴 bug: user null. Add guard.` |
| `/caveman-stats` | Real session token usage, lifetime savings, USD. `--share` for tweetable line |
| `/caveman-compress <file>` | Rewrite memory files (like `CLAUDE.md`) into caveman-speak. ~46% input token savings forever |
| `caveman-shrink` | MCP middleware — wraps any MCP server, compresses tool descriptions. [npm](https://www.npmjs.com/package/caveman-shrink) |
| `cavecrew-*` | Caveman subagents (investigator, builder, reviewer) |

## Benchmarks

Average **65% output reduction** (range 22–87%) across 10 tested prompts:

| Task | Normal | Caveman | Saved |
|------|--------|---------|-------|
| Explain React re-render bug | 1180 | 159 | 87% |
| Fix auth middleware token expiry | 704 | 121 | 83% |
| Set up PostgreSQL connection pool | 2347 | 380 | 84% |
| Docker multi-stage build | 1042 | 290 | 72% |
| Implement React error boundary | 3454 | 456 | 87% |
| **Average** | **1214** | **294** | **65%** |

Input tokens are untouched — savings are on output only. The skill adds ~1–1.5k input tokens per turn. Full honest breakdown in [HONEST-NUMBERS.md](https://github.com/JuliusBrussee/caveman/blob/main/docs/HONEST-NUMBERS.md).

### caveman-compress Input Savings

| File | Original | Compressed | Saved |
|------|----------|------------|-------|
| claude-md-preferences.md | 706 | 285 | 59.6% |
| project-notes.md | 1145 | 535 | 53.3% |
| todo-list.md | 627 | 388 | 38.1% |
| **Average** | **898** | **481** | **46%** |

## Caveman Ecosystem

| Repo | What it shrinks |
|------|----------------|
| [caveman](https://github.com/JuliusBrussee/caveman) | What the agent **says** (this repo) |
| [caveman-code](https://github.com/JuliusBrussee/caveman-code) | The **whole agent**, end to end (~2× fewer tokens than Codex) |
| [cavemem](https://github.com/JuliusBrussee/cavemem) | What the agent **remembers**, across sessions |
| [cavekit](https://github.com/JuliusBrussee/cavekit) | The **build loop** — spec-driven, no guessing |
| [cavegemma](https://github.com/JuliusBrussee/finetune-caveman) | Compression **baked into weights** (Gemma fine-tune) |

### Sibling Skills Pack

`npx skills@latest add JuliusBrussee/skills` installs 5 skills:

| Skill | Description |
|-------|-------------|
| caveman | Speak less, say more |
| grill-me | Agent grills your plan before you build the wrong thing |
| interface-kit | Build UI that looks good, loads fast, works for everyone |
| junior-to-senior | Adversarial review pass |
| loop-factory | Spec-driven task loop — inbox → active → archive |

## How It Works

1. Install drops a skill file into your agent
2. Skill tells agent: drop filler, keep substance, use fragments — but never touch code, commands, or errors
3. On Claude Code, a hook writes a tiny flag file each session, so the agent talks caveman from message one
4. `/caveman-stats` reads session log, counts tokens saved, writes to statusline
5. `/caveman-compress` rewrites memory files so every future session starts smaller

## Caveman 2

Currently in development. Measurable, verifiable token savings across a whole team — real receipts, real dashboard. Waitlist: [caveman.so](https://caveman.so)

## Key Design Principles

1. **Shrinks mouth, not brain** — compresses output style, never technical content
2. **Language-preserving** — write Portuguese, caveman grunts Portuguese. `wenyan` mode is the exception (classical Chinese packs most meaning per token)
3. **Zero telemetry** — no network calls after install
4. **Per-agent install** — auto-detects every agent on the machine
5. **Research-backed** — cited paper shows brevity constraints can improve accuracy by ~26 points
