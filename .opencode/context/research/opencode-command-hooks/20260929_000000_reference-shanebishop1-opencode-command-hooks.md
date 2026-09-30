---
title: opencode-command-hooks (shanebishop1) — declarative shell hooks on events
tags: [research, plugin, hooks, opencode, event-driven, shell, injection]
status: complete
sources:
  - https://github.com/shanebishop1/opencode-command-hooks
date: 2026-09-29
---

# opencode-command-hooks — reference design

Upstream plugin (MIT, ~15k LOC incl. tests) that lets you attach **shell commands to
tool and session events** declaratively, and inject their output into the session.

## The idea

```yaml
# agent markdown frontmatter
hooks:
  after:
    - run: ["npm run typecheck", "npm run lint", "npm test"]
      inject: "Validation (exit {exitCode}):\n{stdout}\n{stderr}"
```

```jsonc
// .opencode/command-hooks.jsonc
{
  "truncationLimit": 30000,
  "tool": [{ "id": "x", "when": { "phase": "after", "tool": "task" }, "run": "npm test", "inject": "{stdout}" }]
}
```

## Surface (complete)

| Field | Notes |
|---|---|
| `run` | `string \| string[]`; array runs **sequentially**, later commands still run after a failure |
| `inject` | template → session message |
| `toast` | `title`/`message`/`variant`(info\|success\|warning\|error)/`duration` |
| `when.phase` | `before \| after` (tool) |
| `when.tool` | `string \| string[] \| "*"` |
| `when.callingAgent` | agent/subagent name |
| `when.toolArgs` | exact `string`, `string[]`, `{glob}`, `{regex}` — AND across keys |
| `overrideGlobal` | suppress global hooks for same event/phase+tool |
| `truncationLimit` | per stdout/stderr, default 30000 |
| `ignoreGlobalConfig` | skip the global file |
| session `when.event` | `session.created` \| `session.start` (alias) \| `session.idle` |
| session `when.rootSessionOnly` | default `true` for idle, `false` otherwise |

Placeholders: `{id} {agent} {tool} {cmd} {stdout} {stderr} {exitCode} {args.<key>}`.

Tool args reach the command via a private temp JSON file in
`$OPENCODE_HOOK_ARGS_FILE` (not interpolated into the command string — avoids
shell-injection via argument values); deleted after the last command.

Config precedence: `~/.config/opencode/command-hooks.jsonc` merged with
`<project>/.opencode/command-hooks.jsonc`. Same `id` → project wins; otherwise
concatenated. Markdown hooks get generated ids; a markdown hook beats a config
hook of the same id. Duplicate ids in one source is an error.

## Notable implementation choices worth copying

- **Glob matching is deliberately not picomatch's default**: `nonegate: true` and
  `strictBrackets: true`, so a leading `!` is a literal and a leading `#` is not a
  comment. Documented, because silently changing those semantics breaks configs.
- Schema-validates each config *source* independently; a bad type in one file
  invalidates that file only, not the other.
- Tool-arg patterns only match string values at runtime.
- After-hook dedupe per `(sessionID, callID)` with a TTL, so a retried after-hook
  does not re-run the commands.
- Commands never throw into the tool call: hook failure must not block the tool.

## Where this configuration diverges (and why)

Upstream injects with `client.session.promptAsync(...)` — **one full inference
request per injection**. This configuration already has a deferred queue
(`plugins/hooks/session.ts` → `queueContextMessage`) that is drained into the next
turn's system transform. The local port injects through that queue instead, so a
hook result costs **zero** extra inference requests. That is the main reason to
own the code rather than depend on the package.

Two further local extensions:
- `injectOn: "always" | "failure"` — inject only on non-zero exit. A green test
  run then costs nothing in tokens, which is the difference between a hook that
  gets used and one that gets disabled.
- Hook results are truncated to a token budget, not only a character limit.

## Related

- The config's own `rules/efficiency-first.md` sets the budgets these hooks are written to respect.
