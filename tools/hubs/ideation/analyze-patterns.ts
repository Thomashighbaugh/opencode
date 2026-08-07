import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_BASH } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "analyze-patterns",
  description: "Analyze code patterns and anti-patterns — consistencies, convention violations",
  reminder: "Analyze codebase patterns and anti-patterns.",
  inline: true,

  detailedDescription: `Analyzes code patterns and anti-patterns across the codebase. Parameterized for scoped, repeatable analysis.

## Parameters

| Flag | Values | Default | Purpose |
|------|--------|---------|---------|
| \`--pattern <name>\` | error-handling, naming, structure, state, concurrency, io, api, ui | all | Which pattern family to analyze |
| \`--language <lang>\` | typescript, python, go, rust, java, all | all | Restrict scan to one language |
| \`--depth <level>\` | shallow, medium, deep | medium | Scan breadth: shallow = single pass; medium = pattern extraction; deep = full convention audit |
| \`--output <fmt>\` | json, markdown | markdown | Report format |

Positional argument (e.g. \`/ideation analyze-patterns "error handling"\`) is treated as \`--pattern error-handling\`.

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

The analysis results can be persisted to the durable context registry (.\\.opencode/context/patterns/) for cross-session reuse via /harvest-context.`,

  tools: TOOLS_BASH,
  relatedSkills: ["convention-extractor"],
  examples: [
    {
      input: "/ideation analyze-patterns \"error handling\" --language typescript --depth deep",
      approach: "Deep audit of error-handling patterns in TS files: extract all try/catch, promise rejection, and result-type patterns; group by style; flag inconsistent handling with file:line references.",
    },
    {
      input: "/ideation analyze-patterns --pattern naming --output json",
      approach: "Programmatic naming-convention audit: scan identifiers, group by detected convention, output JSON for downstream tooling or diffing against a conventions fingerprint.",
    },
    {
      input: "/ideation analyze-patterns --depth shallow",
      approach: "Quick single-pass sweep for obvious anti-patterns and inconsistencies — fast triage before a deeper refactoring analysis.",
    },
  ],
  warnings: [
    "Deep scans traverse the whole codebase — use --language and --pattern to scope on large repos.",
    "Read-only: this subcommand never modifies code. Use /orchestrate with a refactoring skill to act on findings.",
  ],
}

export default spec
