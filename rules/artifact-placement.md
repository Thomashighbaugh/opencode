# Artifact Placement Rule

**Never create standalone scripts at the project root or any top-level directory.**

## The Problem

Agents (executor, skill-creator, refactoring, provision, and any subagent) have a tendency to create standalone `.sh`, `.ts`, `.mjs`, `.py` files at the project root when they need to generate an executable artifact. This creates:

- **Root directory pollution**: `./deploy.sh`, `./migrate.ts`, `./tools/`, `./scripts/` at the project root
- **Discovery failure**: OpenCode auto-discovers tools from `.opencode/tools/`, not from the project root
- **Git tracking confusion**: Root-level scripts are often committed unintentionally
- **Inconsistency**: Every project ends up with a different ad-hoc layout

## The Solution

All executable artifacts MUST go into their designated `.opencode/` subdirectory:

| Artifact Type | Location | Example |
|---------------|----------|---------|
| TypeScript tools | `.opencode/tools/` | `.opencode/tools/project-info.ts` |
| Skill scripts | `.opencode/skills/{name}/scripts/` | `.opencode/skills/deploy/scripts/deploy.sh` |
| Slash commands | `.opencode/commands/` | `.opencode/commands/build.md` |
| Shell scripts (skill-bundled) | `skills/{name}/scripts/` | `skills/my-skill/scripts/helper.sh` |
| package.json scripts | `package.json` scripts field | `"scripts": { "build": "tsc" }` |

## Forbidden Patterns

| Pattern | Why It's Wrong | Correct Alternative |
|---------|---------------|-------------------|
| `./deploy.sh` at project root | Root pollution, not auto-discovered | `.opencode/tools/deploy.ts` |
| `./tools/` at project root | OpenCode looks in `.opencode/tools/` | `.opencode/tools/` |
| `./scripts/` at project root | No auto-discovery for root scripts | `.opencode/skills/{name}/scripts/` |
| `./migrate.ts` at project root | Not registered as a tool | `.opencode/tools/db-migrate.ts` |
| `./my-command.sh` at project root | Not a slash command | `.opencode/commands/my-command.md` |
| Any standalone executable not in `.opencode/` | Won't be found by agents or OpenCode | Move to appropriate `.opencode/` subdirectory |

## Scope

This rule applies to:

1. **Global config directory** (`~/.config/opencode/`) — skills, tools, commands, agents all live in their designated subdirectories
2. **Any project being worked on** — project-specific artifacts go into `.opencode/` subdirectories
3. **All agents** — hubs, executor, skill-creator, refactoring, provision, and any subagent

## Enforcement

- **Hubs agent**: Has a hard constraint in `<Constraints>` section
- **Executor agent**: Has a hard constraint in `<Constraints>` section
- **Skill-creator agent**: Has a dedicated section documenting the rule
- **Refactoring agent**: Has a dedicated section documenting the rule
- **Provision skill**: Generates tools into `.opencode/tools/` by default
- **Code review**: `@code-reviewer` should flag root-level scripts as a smell
- **Verification**: `@verifier` should check for root-level scripts during completion checks

## Exceptions

The only allowed exceptions are:

1. **`package.json` scripts** — these are the standard Node.js convention
2. **`Makefile`** — standard build system convention
3. **`docker-compose.yml`** — standard Docker convention
4. **`.github/workflows/*.yml`** — GitHub Actions workflow files
5. **`install.sh`** — only if the project is explicitly a distribution/installer package
