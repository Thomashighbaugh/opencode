import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_BASH } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "analyze-patterns",
  description: "Analyze code patterns and anti-patterns — consistencies, convention violations",
  reminder: "Analyze codebase patterns and anti-patterns. Asks: pattern + language + depth + format.",
  inline: true,

  detailedDescription: `Analyzes code patterns and anti-patterns across the codebase. Parameterized for scoped, repeatable analysis.

## Predefined Pattern Families

- **error-handling** — try-catch vs promise rejection vs result types; error wrapping; swallowed errors
- **naming** — casing conventions, abbreviations, single-letter names, prefix/suffix consistency
- **structure** — module boundaries, file organization, dependency direction, god objects
- **state** — global mutable state, prop drilling, state management patterns, caching
- **concurrency** — race conditions, async/await vs callbacks, thread-safety patterns
- **io** — sync vs async I/O, retry patterns, timeout handling, resource cleanup
- **api** — endpoint conventions, validation, error response shape, pagination
- **ui** — component patterns, styling conventions, accessibility, responsive patterns

## Scan Behavior

- **Repeated patterns** (good — candidates for extraction).
- **Anti-patterns** (bad — should be refactored).
- **Inconsistent patterns** (same problem solved different ways).
- **Convention violations** (naming, structure, error handling).

## Output

- **Markdown** (default): grouped report with locations (file:line), detected pattern instances, and recommendations per group.
- **JSON**: structured output for programmatic use — \`{ "families": [{ "name", "instances": [{ "file", "line", "match" }], "recommendation" }] }\`.

The report is saved to .opencode/state/ideation/work-products/ with ISO date prefix. Read-only analysis — no code is modified.

## Registry

The analysis results can be persisted to the durable context registry (.opencode/context/patterns/) for cross-session reuse via /memory-hub.

## Gatekeeping Question

Before scanning, ask (passing the flags skips the question — non-interactive path):

> **Question 1 — pattern family?**
> 1. all (default)
> 2. error-handling
> 3. naming
> 4. structure
> 5. state
> 6. concurrency
> 7. io
> 8. api
> 9. ui
> (or type your own)
>
> **Question 2 — language?**
> 1. all (default)
> 2. typescript
> 3. python
> 4. go
> 5. rust
> 6. java
>
> **Question 3 — scan depth?**
> 1. shallow — single pass
> 2. medium (default) — pattern extraction
> 3. deep — full convention audit
>
> **Question 4 — report format?**
> 1. markdown (default)
> 2. json

Resolved answers map to \`--pattern\`, \`--language\`, \`--depth\`, and \`--output\`.`,

  tools: TOOLS_BASH,
  relatedSkills: ["convention-extractor"],
  examples: [
    {
      input: "/research-hub analyze-patterns",
      approach: "Asks pattern (error-handling), language (typescript), depth (deep), format (markdown). Deep audit of error-handling patterns in TS files: extract all try/catch, promise rejection, and result-type patterns; group by style; flag inconsistent handling with file:line references."
    },
    {
      input: "/research-hub analyze-patterns --pattern naming --output json",
      approach: "Flags passed → gates skipped. Programmatic naming-convention audit: scan identifiers, group by detected convention, output JSON for downstream tooling or diffing against a conventions fingerprint."
    }
  ],
  warnings: [
    "Deep scans traverse the whole codebase — use --language and --pattern to scope on large repos.",
    "Read-only: this subcommand never modifies code. Use /build-hub with a refactoring skill to act on findings.",
  ],
}

export default spec
