# Command Hooks — `plugins/command-hooks/`

Declarative shell commands bound to tool and session events, whose output is injected into the
agent's context. A local port of
[`shanebishop1/opencode-command-hooks`](https://github.com/shanebishop1/opencode-command-hooks)
(MIT), with two deliberate divergences documented below.

1,726 LOC across 7 modules. 106 tests.

| Module         | Role                                                          |
| -------------- | ------------------------------------------------------------- |
| `index.ts`     | Plugin entry, event dispatch, `createHandlers` test seam       |
| `config.ts`    | Global + project + agent-frontmatter sources, merge precedence |
| `schema.ts`    | Per-source validation — a bad file disables only itself        |
| `matcher.ts`   | `when` matching, glob/regex, `overrideGlobal` resolution       |
| `execute.ts`   | Sequential shell, truncation, `OPENCODE_HOOK_ARGS_FILE`        |
| `template.ts`  | Placeholder interpolation                                      |
| `types.ts`     | The configuration surface                                      |

---

## Why this is a local port rather than a dependency

The upstream package injects hook output with:

```ts
await client.session.promptAsync({
  path: { id: input.sessionID },
  body: { parts: [{ type: 'text', text: message }] },
})
```

That is a **full inference request per hook result**, and the text arrives as a synthetic user
turn. Running validation after every subagent completion would then mean one model call per
subagent, forever.

This configuration already has a deferred queue
(`plugins/hooks/session.ts` → `queueContextMessage`, drained into the next turn's system
transform). This plugin routes injections through it, so **a hook result costs zero extra
inference requests**. `promptAsync` remains as a fallback for a standalone install, and a test
asserts the fallback is not taken when the hooks plugin is present.

### Two local additions

**`injectOn: "failure"`** — report only when the last command exited non-zero.

```jsonc
{ "run": "npx tsc --noEmit", "injectOn": "failure", "inject": "…{stdout}…" }
```

A green typecheck reports nothing and costs no tokens. Without it, a hook that fires on every
subagent completion spends the user's tokens telling the agent that everything is fine, and the
cheapest way to get such a hook switched off is for it to be noisy. This is the option that makes
the feature usable at all.

**`injectLimit`** — the character cap above (`truncationLimit`, default 30,000) bounds each
*stream*; `injectLimit` (default 4,000) bounds the *assembled message* that actually reaches the
model, so a chatty command cannot flood the next turn's context.

---

## Configuration

### Sources and precedence

| Source                                        | Scope             |
| --------------------------------------------- | ----------------- |
| `~/.config/opencode/command-hooks.jsonc`      | Every project     |
| `<project>/.opencode/command-hooks.jsonc`      | One project       |
| `hooks:` in an agent's markdown frontmatter    | One subagent      |

| Situation                       | Result                                       |
| ------------------------------- | -------------------------------------------- |
| Different hook ids              | Both run, global first                       |
| Same hook id                    | Project replaces global                      |
| `overrideGlobal: true`          | Suppresses global hooks for same phase+tool  |
| `ignoreGlobalConfig: true`      | Global file is not read at all               |
| `disabled: true`                | That hook never runs                         |
| Both set `truncationLimit`      | Project wins                                  |

Each source is validated **independently**. A malformed project file disables that file and
reports the error; the global file and any agent frontmatter still load. One bad key anywhere
disabling every hook in the session is the behaviour that gets a plugin uninstalled.

### Field reference

| Field           | Type                             | Notes |
| --------------- | -------------------------------- | ----- |
| `run`           | `string \| string[]`             | Sequential. A failure does **not** stop later commands — a lint error must not hide a typecheck error. |
| `inject`        | `string`                         | Template; reported into the next turn's context. |
| `injectOn`      | `"always" \| "failure"`          | Default `always`. Use `failure` for validation. |
| `toast`         | `object`                         | `title`, `message`, `variant`, `duration`. Free — no tokens. |
| `overrideGlobal`| `boolean`                        | JSON boolean. `"true"` is rejected. |
| `disabled`      | `boolean`                        | Skip one inherited hook. |
| `truncationLimit` | `number`                      | Per stdout/stderr, default 30,000. |
| `injectLimit`   | `number`                         | Whole message, default 4,000. |

### `when` — tool hooks

| Field           | Notes |
| --------------- | ----- |
| `phase`         | `"before" \| "after"` — required |
| `tool`          | Name, list, or `"*"`. Omitted matches all. |
| `callingAgent`  | Subagent name for `task` calls. |
| `toolArgs`      | Argument filters. **Every** key must match (AND). |

A `toolArgs` filter on a key the call did not provide does **not** match — otherwise "run this
when `path` is `src/**`" fires on every call that has no `path` at all.

### Argument matchers

| Form                | Behaviour |
| ------------------- | --------- |
| `"src/index.ts"`    | Exact string |
| `["a", "b"]`        | Any exact member |
| `"*"`               | Any value |
| `{ "glob": "**/*.{ts,js}" }` | Full-string glob |
| `{ "regex": "TODO" }` | JavaScript regex search |

Two semantics are pinned deliberately, because a library default that changes them would break
existing configs without warning:

- **A leading `!` is literal**, not an implicit negation.
- **A leading `#` is not a comment.**

Pattern matchers only match values that are **strings at runtime**. A regex against an object
does not silently match the object's JSON.

### Placeholders

| Placeholder                          | Value |
| ------------------------------------ | ----- |
| `{id}` `{tool}` `{agent}` `{event}`  | Hook metadata |
| `{cmd}` `{stdout}` `{stderr}` `{exitCode}` | **Last** command only |
| `{args.<key>}`                       | A tool argument |
| `{results.<n>.<field>}`              | That command in the chain |

`{stdout}` is the last command on purpose. For `lint → typecheck → test`, the value that matters
is the one that failed *last*; concatenating every stream lets a passing lint bury the error
underneath it. Use `{results.N.stdout}` when every step's output matters.

Missing and `null` values render as `""`. `{args.x}` reads own properties only, so
`{args.toString}` does not render a function body.

---

## Shell safety

Argument values are **never** interpolated into the command string. The complete argument object
is written to a private temp file, its path in `$OPENCODE_HOOK_ARGS_FILE`, removed after the last
command:

```jsonc
{ "run": "jq -r '.filePath' \"$OPENCODE_HOOK_ARGS_FILE\"" }
```

A tool call with no arguments gets `{}`. An argument containing `; rm -rf /` is data, never
syntax. The file is `0o600` and the cleanup runs in a `finally`, so a timeout mid-chain does not
leave argument payloads in the temp directory.

---

## Shipped defaults

`command-hooks.jsonc` at the repository root. All three validation hooks use `injectOn: "failure"`.

| Hook | Fires | Runs | Injects |
| ---- | ----- | ---- | ------- |
| `typecheck-after-task` | `after` + `task` | `npx tsc --noEmit` | On failure only |
| `tests-after-task` | `after` + `task` | `npm test`, gated on a `test` script existing | On failure only |
| `graph-integrity-after-write` | `after` + write/edit/patch, glob `skills/graph-context/scripts/*.ts` | `tsc -p skills/tsconfig.json` | On failure only |
| `session-start-context` | `session.start` | branch + repo name | Always (cheap) |

`tests-after-task` is gated on `package.json` actually declaring a `test` script. A bare
`|| true` would make "no test script exists" indistinguishable from "the suite passed", and the
hook would report a false green.

### What this replaces

`rules/efficiency-first.md` and `rules/karpathy-guidelines.md` both instruct agents to verify
their own work. That instruction costs tokens in the reminder that carries it and depends on
compliance. These hooks run on the event, every time, without being asked. The prose rules are
now describing a default the runtime already enforces.

---

## Per-project provisioning

`/scaffold-hub provision` generates `.opencode/command-hooks.jsonc` from the **detected** stack,
not from a fixed template:

```jsonc
"run": ["npm run lint", "npm test"],
"injectOn": "failure"
```

A hook pointing at a command the project does not have would fail on every subagent completion
and get disabled, so only commands the detector resolved from a real `package.json` are emitted. A
project with neither gets a valid, empty file with the shape documented in comments — the
feature stays discoverable without shipping a broken hook.

The generator is exercised by tests that load the shipped function out of `provision.ts` and
validate its output through the plugin's own validator. A generated file nobody parses is a
template, not a feature.

---

## Testing

`tests/global/command-hooks.test.ts` — 106 tests, none of which assert on source text. Every test
builds a config, fires an event through `createHandlers` (the same function the plugin calls), and
checks what the command actually did.

Covered: config validation and per-source isolation · JSONC parsing · every matcher form and the
two pinned glob semantics · `overrideGlobal` canonicalisation and wildcard intersection ·
sequential execution with failure isolation · truncation · the args file and its cleanup ·
placeholder rendering · injection and `injectOn` · dispatch ordering, after-hook dedupe, and
`callingAgent` propagation · session-root filtering · the generated provision file · end-to-end
injection into the real session queue.

### Bugs this suite found in the plugin

| Bug | Effect |
| --- | ------ |
| After-hook dedupe set the timestamp *then* compared it | Delta always 0 — **every after-hook silently dropped** |
| `callingAgent` read from the after-hook's args | OpenCode passes none, so the filter matched nothing on exactly the event it is written for |
| `session.start` alias resolved at one call site | The documented spelling was **dead** |
| Override suppression compared tool lists one-way | A global hook on `*` was **unreplaceable** |
| `'` treated as a string delimiter in the JSONC parser | An apostrophe in a comment ate the rest of the file |
| `generateCommandHooks` hand-escaped JSON | Emitted **invalid JSON** |

---

## Interdependencies

| Depends on                          | From |
| ---------------------------------- | ---- |
| `queueContextMessage`              | [event interception](plugins-hooks.md) |
| `parseFrontmatter`, `js-yaml`      | shared with [`yaml-edit`](../tools/yaml-edit.ts) |
| picomatch                          | same matcher OpenCode's `Glob` tool uses |
| `/scaffold-hub provision`          | writes the project-level config |
