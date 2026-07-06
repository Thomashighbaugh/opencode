---
title: "Arcanum — Runecraft Ecosystem Monorepo"
type: source-summary
tags: [opencode, plugin, monorepo, skills, memory, cli, agent, runecraft]
created: 2026-07-04
updated: 2026-07-04
sources: [github-readme, contributing-guide, npm-registry]
status: active
---

# Arcanum — The Runecraft Ecosystem

**Arcanum** is the central vault of the [Runecraft](https://github.com/runecraft) ecosystem — a monorepo where skills are spells studied by AI agents, configurations are grimoires, and the CLI is the circle of summoning.

- **Repository**: [runecraftai/arcanum](https://github.com/runecraftai/arcanum)
- **Stack**: Bun workspaces, Turborepo v2, Changesets, Biome
- **License**: MIT

## Artifacts (Packages)

| Artifact | Package | Version | Purpose | Status |
|----------|---------|---------|---------|--------|
| **Spells** | `@runecraft/spells` | 0.14.0 | Skill scrolls — SKILL.md files studied by AI agents to learn specialized rites | Active |
| **Summon** | `@runecraft/summon` | 0.17.0 | The summoning circle — CLI that invokes and installs spells into any project | Active |
| **Runes** | `@runecraft/runes` | 0.2.0 | Carved sigils — OpenCode plugin that gives agents durable, per-repo memory | Active |
| **Grimoire** | `@runecraft/grimoire` | — | Shared sigils — Biome and TypeScript configs inherited by every package | Active |
| **Guild** | `@runecraft/guild` | — | Party charters — multi-agent swarm and orchestration configurations | Placeholder |
| **Familiar** | `@runecraftai/familiar` | — | Internal Pi multi-agent runtime (not published) | Internal |

### Spells (`@runecraft/spells`)
- Agent skill definitions — prompts and instructions for AI coding agents
- Published on npm, 54 files in latest build
- Requires Node >= 18

### Summon (`@runecraft/summon`)
- Interactive CLI for installing Arcanum agent skills
- Binary: `summon`
- Built with `citty`, `@clack/prompts`, `picocolors`
- Dependencies include `@runecraft/spells`
- Uses a `postinstall` script to patch clack prompts

### Runes (`@runecraft/runes`)
- Persistent cross-session memory plugin for OpenCode
- Built with `@opencode-ai/plugin` SDK and Zod for validation
- Binary: `runes`
- Requires Node >= 22
- Uses `@runecraft/grimoire` for shared tooling configs

## Stack

- **Bun workspaces** — native package linking and runtime
- **Turborepo v2** — task orchestration with caching and parallelization
- **Changesets** — independent semver versioning per artifact
- **Biome** — unified lint and format, configured via grimoire
- **Conventional Commits** — enforced by commitlint with type scopes per package

## Key Development Practices

- All commits follow Conventional Commits with scoped types (feat, fix, docs, etc.)
- Scopes: `summon`, `spells`, `runes`, `spawn`, `familiar`, `guild`, `grimoire`, `deps`, `release`
- Changeset workflow: `bun changeset` creates versioning files, CI auto-generates changesets from commits
- Automated release flow via GitHub Actions: version PR → merge → npm publish → GitHub Release
- Workspace dependencies use `workspace:*` — auto-converted to semver ranges during publishing
- `@runecraft/familiar` is excluded from versioning/publishing (private package)
- Tag format: `@runecraft/<package>@<version>` (auto-managed by release workflow)
