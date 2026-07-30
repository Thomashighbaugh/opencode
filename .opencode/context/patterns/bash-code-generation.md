---
name: bash-code-generation
tags: [bash, template-literals, escaping, patterns]
---

# Bash Code Generation Patterns

## Template Literal Escaping

When generating bash code inside TypeScript template literals, `${...}` is interpreted by TS:

| Desired bash output | TypeScript template literal |
|---------------------|---------------------------|
| `${VAR}` | `\${VAR}` |
| `"${VAR[@]}"` where VAR is from a TS variable `v` | `"\${${v}[@]}"` |

**Anti-pattern:** Using `\\${...}` (double backslash) produces a literal backslash in bash output. Forgetting to escape causes TS interpolation of undefined bash syntax.

## `local` Keyword Scope

The bash `local` keyword can only be used inside a function body. Using it at script top level causes a runtime error.

**Apply:** Check whether a variable declaration is inside a function before using `local`.

## Brace Grouping vs JSON Output

When writing bash scripts that produce JSON, wrapping printf statements in `{ ... }` creates a **command group** — the `{` and `}` are NOT part of the JSON output. The opening `{` must be part of the first printf string.

**Anti-pattern:**
```bash
lines.push("{")  # WRONG — produces "ok": true...} which is invalid JSON
printf '"ok": true...'
```

**Correct:** Embed the opening brace in the printf string: `printf '{"ok": true, ...'`

## Boolean Output

Compare `$(VAR && echo true || echo false)` — **wrong**: tries to execute `VAR` as a command.
**Correct:** `"$VAR"` — the variable already holds `true` or `false`.
