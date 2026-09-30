---
name: command-hooks
description: Run shell commands automatically on tool and session events, and inject their output into the agent's context. Use when configuring validation (typecheck, lint, tests) that should run after a subagent finishes, when setting up a new project, or when a hook should fire on a specific tool, tool argument, or session event. Covers command-hooks.jsonc, agent frontmatter hooks, matchers, overrideGlobal, and injectOn.
---

# Command Hooks

Declarative shell commands attached to tool and session events. A hook runs on the
event whether or not anyone remembers to ask for it, and its output can be injected
into the agent's context so the agent reacts to failures without being told to look.

## When to use this

| Situation | Hook |
|-----------|------|
| A subagent claims success but the build is broken | `typecheck-after-task` (already global) |
| You want lint/tests to run after a subagent, every time | `run: "npm run lint && npm test"`, `injectOn: "failure"` |
| A command should run only for edits to a specific path | `when.toolArgs.filePath.glob` |
| A project needs different validation than the global default | same `id` replaces it, or `overrideGlobal: true` |
| State to surface once at session start | `session` hook on `session.start` |

**Prefer a hook over instructing an agent.** A rule that says "verify your work"
depends on the agent complying and costs tokens in the reminder. A hook runs on
the event, costs nothing when it passes, and cannot be forgotten.

## The two files

| File | Scope |
|------|-------|
| `~/.config/opencode/command-hooks.jsonc` | Every project. This config's defaults live here. |
| `<project>/.opencode/command-hooks.jsonc` | One project. Created by `/scaffold-hub provision`. |

Both are optional and both are validated on their own — a broken project file
disables that file, not the global one.

## Precedence

| Situation | Result |
|-----------|--------|
| Different hook ids | Both run, global first |
| Same hook id | Project replaces global |
| `overrideGlobal: true` | Suppresses every global hook for the same phase+tool (or event) |
| `ignoreGlobalConfig: true` | Global file is not read at all |
| Both set `truncationLimit` | Project wins |
| `disabled: true` | That hook never runs, and the global one it shadows stays off |

Override matching is on the canonical `phase::tool` key, so a global hook written
as `"bash"` is suppressed by a project hook written as `["bash"]`.

## Writing a hook

```jsonc
{
  "tool": [
    {
      "id": "lint-after-write",
      "when": { "phase": "after", "tool": ["write", "edit"] },
      "run": ["npm run lint", "npm run typecheck"],
      "injectOn": "failure",
      "inject": "Lint failed (exit {exitCode}):\n```\n{stdout}\n{stderr}\n```",
      "toast": { "title": "lint", "message": "exit {exitCode}", "variant": "error" }
    }
  ]
}
```

### Fields

| Field | Type | Notes |
|-------|------|-------|
| `run` | `string \| string[]` | Sequential. A failure does **not** stop later commands — a lint error must not hide a typecheck error. |
| `inject` | `string` | Template. Reported into the agent's context. |
| `injectOn` | `"always" \| "failure"` | **Default `always`.** Use `"failure"` for validation: a passing check then costs zero tokens. |
| `toast` | `object` | `title`, `message`, `variant` (`info`/`success`/`warning`/`error`), `duration`. Free — no tokens. |
| `overrideGlobal` | `boolean` | JSON boolean. `"true"` is rejected. |
| `disabled` | `boolean` | JSON boolean. Skip one inherited hook. |
| `truncationLimit` | `number` | Per stdout/stderr, default 30000. |
| `injectLimit` | `number` | Cap on the whole rendered message, default 4000. |

### `when` for tool hooks

| Field | Notes |
|-------|-------|
| `phase` | `"before"` \| `"after"` — required |
| `tool` | Name, list, or `"*"`. Omitted matches all. |
| `callingAgent` | Subagent name for `task` calls. |
| `toolArgs` | Argument filters. **Every** key must match (AND). |

A `toolArgs` filter on a key the call did not provide does **not** match — a
"when path is `src/**`" hook must not fire for a call that had no path.

### `toolArgs` value forms

| Form | Behaviour |
|------|-----------|
| `"src/index.ts"` | Exact string match |
| `["a", "b"]` | Any exact match |
| `"*"` | Any value |
| `{ "glob": "**/*.{ts,js}" }` | Full-string glob. `!` is literal, not negation. |
| `{ "regex": "TODO" }` | JavaScript regex search |

Patterns only match values that are strings at runtime. A regex against an object
does not silently match its JSON.

### `when` for session hooks

| Field | Notes |
|-------|-------|
| `event` | `"session.created"` \| `"session.start"` (alias) \| `"session.idle"` — required |
| `agent` | Agent name filter |
| `rootSessionOnly` | Defaults to `true` for `session.idle`, `false` otherwise. Leave it: a finished subagent's child session going idle is not the user being prompted, and notifying on it produces a storm mid-fan-out. |

## Placeholders

| Placeholder | Value |
|-------------|-------|
| `{id}` | Hook id |
| `{agent}` | Calling agent / subagent |
| `{tool}` | Tool name |
| `{event}` | Session event |
| `{cmd}` | Last command |
| `{stdout}` `{stderr}` | Last command's output, truncated |
| `{exitCode}` | Last command's exit code |
| `{args.<key>}` | A tool argument |
| `{results.<n>.<field>}` | That command in the chain — `cmd`/`stdout`/`stderr`/`exitCode` |

`{stdout}` is the **last** command only, deliberately: for lint → typecheck → test,
the value that matters is the one that failed last, and concatenating every stream
lets a passing lint bury the error underneath it. Use `{results.N.stdout}` when
every step's output matters.

Missing and `null` values render as `""`. `{args.x}` reads own properties only.

## Tool arguments and shell safety

Argument values are **never** interpolated into the command string. The complete
argument object is written to a private temp file, its path in
`$OPENCODE_HOOK_ARGS_FILE`, removed after the last command:

```jsonc
{ "run": "jq -r '.filePath' \"$OPENCODE_HOOK_ARGS_FILE\"" }
```

A tool call with no arguments gets `{}`. An argument that looks like shell syntax
does not execute.

## Agent frontmatter hooks

Hooks scoped to one subagent, in its own markdown file:

```markdown
---
name: executor
description: Focused task executor for implementation work.
mode: subagent
hooks:
  before:
    - run: "echo 'executor starting'"
      toast: { message: "executor starting", variant: "info" }
  after:
    - run: ["npm run typecheck", "npm test"]
      injectOn: failure
      inject: "Validation failed (exit {exitCode}):\n{stdout}"
---
```

These are scoped to that agent, so they do not fire for other agents' tool calls.
They merge with the global list, and take precedence on id collision.

## Cost model

| Path | Cost |
|------|------|
| Command runs | Local process, no tokens |
| `injectOn: "failure"` and it passed | **0 tokens** |
| `injectOn: "failure"` and it failed | Tokens for the clamped message only |
| `toast` | 0 tokens |
| Injection transport | Queued into the next turn — **0 extra inference requests** |

Injection goes through the hooks plugin's session queue, not
`client.session.promptAsync`. A hook result is context the agent is already
reading, not a new prompt. `promptAsync` is only a fallback when the hooks plugin
is not loaded.

## Verifying a hook

```bash
# config parses and every hook id is listed
npx tsx -e "import('./plugins/command-hooks/index.ts').then(m => {
  const r = m.loadConfig(process.cwd())
  console.log(r.errors, r.config.tool.map(h => h.id))
})"
```

A config error is reported once per session and never blocks a tool call. Hooks
fail soft by design: a hook is decoration on someone else's operation, and it must
never turn a working tool call into a failing one.

## Related

- Design notes and the upstream reference:
  `.opencode/context/research/opencode-command-hooks/`
- `rules/efficiency-first.md` — the budget these hooks are written to respect
- `skills/verify/SKILL.md` — judgement-based verification, which hooks do not replace
