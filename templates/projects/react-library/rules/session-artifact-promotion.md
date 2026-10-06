---
name: session-artifact-promotion
description: Tools and scripts created during a session with plausible future utility must be promoted from /tmp into the durable .opencode tree and wired for reuse — never left to be reinvented.
---

# Session Artifact Promotion

**Applies to this user configuration (`~/.config/opencode/`) and to every project
configuration derived from it.**

## The Rule

When a session creates a tool, script, or helper in `/tmp` (or any ephemeral location) that has
**plausible future utility**, promote it to a durable location and wire it up for reuse. Do not
leave useful work in `/tmp` to be reinvented next session.

Promotion is not optional cleanup — it is how session work becomes reusable capability.

## Where It Goes

| Artifact                          | User config (`~/.config/opencode/`) | Project (`<project>/.opencode/`) |
| --------------------------------- | ----------------------------------- | -------------------------------- |
| OpenCode tool (TypeScript)        | `tools/`                            | `tools/`                         |
| Skill script (shell / TypeScript) | `skills/<name>/scripts/`            | `skills/<name>/scripts/`         |
| Slash command                     | `commands/` (or a hub spec)         | `commands/`                      |
| Rule / reusable instruction       | `rules/`                            | `rules/`                         |
| Reference knowledge               | `.opencode/context/`                | `context/`                       |

Never place a standalone executable at the project root or top level — promotion targets the
`.opencode/` tree, never the root.

## Wiring It Up

Moving the file is only half the job. Wire it so it is actually reachable:

- **OpenCode tool** → confirm it is auto-discovered from `tools/` (or `.opencode/tools/`);
  register it if the runtime needs it.
- **Skill script** → reference it from the owning `SKILL.md`, and ensure `runSkillScript` can
  dispatch it (`.sh` → bash, `.ts` → bun).
- **Command** → `.opencode/commands/*.md` is auto-discovered; hub commands need a spec.
- **Rule** → add it to `instructions` in `opencode.jsonc`, or make it on-demand with a named
  referrer.
- **Reusable logic** → extend an existing tool/script instead of adding a near-duplicate.

## Why Not Just Ban /tmp

`/tmp` is the right place for scratch work, one-off transforms, and throwaway probes. Banning it
would remove a useful tool. The failure mode is not using `/tmp` — it is *leaving useful work
there*. This rule keeps the scratch space and captures the value.

## Judgement

- **Promote** when the artifact is likely to be needed again: a parser, generator, validator,
  formatter, analysis/graph helper, or repeatable build step.
- **Discard** when it is genuinely one-shot: a single API probe, a temporary data mangle tied to
  one dataset, a throwaway debug print.
- **When unsure, promote** — a small durable script costs little; reinvention costs a fresh
  session's worth of tokens.
- Promotion writes into the project's own tree and is authorized by the work that produced the
  artifact; it does not need a confirmation prompt.
