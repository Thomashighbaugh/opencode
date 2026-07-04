# Pattern: Template Literal Escaping for Bash Code Generation

**Discovered:** 2026-07-03
**Context:** `tool-scaffolder.ts` generates bash code from TypeScript template literals

## Problem

When generating bash code inside TypeScript template literals, `${...}` is interpreted by TypeScript, not bash. Several escaping bugs emerged:

### Bug 1: Double backslash produces literal backslash

**Bad:** `"\\$\{${v}[@]}"` → generates `\${VAR[@]}` (literal backslash in bash, broken expansion)

**Good:** `"\${${v}[@]}"` → generates `"${VAR[@]}"` (correct bash array expansion)

### Bug 2: Boolean variable run as command

**Bad:** `"$(${v} && echo true || echo false)"` → tries to execute `VERBOSE` as a command

**Good:** `"$${v}"` → generates `"$VERBOSE"` (variable already holds `true` or `false`)

### Bug 3: `local` outside function

**Bad:** `local _first=true` at script top level → runtime error: "local: can only be used in a function"

**Good:** `_first=true` (plain assignment, valid anywhere)

### Bug 4: Bash `{ }` is a command group, not JSON

**Bad:** `lines.push("{")` followed by `printf '"ok": true...'` → outputs `"ok": true...}` (missing opening brace, invalid JSON)

**Good:** `printf '{"ok": true, ...'` → opening brace is part of the printf string, outputs valid JSON

## General Rule

When generating bash from TypeScript template literals:
- `\${` in TS template → literal `${` in bash output (variable expansion)
- `$$` in TS template → literal `$$` ... but `$$${v}` → `$$VARNAME` ... actually use `"$${v}"` for `"$VARNAME"`
- Never use `local` outside function bodies in generated code
- JSON opening/closing braces must be part of printf format strings, not separate bash command group delimiters

## Testing Approach

Strip the `@opencode-ai/plugin` import and `export default tool()` block from a temp copy of the tool file, add function exports, then `require()` and test generators directly. Execute the generated scripts with real arguments and pipe through `python3 -m json.tool` or `JSON.parse()` to validate JSON output.