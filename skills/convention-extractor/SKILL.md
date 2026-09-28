---
name: convention-extractor
description: Analyze a codebase to extract its actual coding conventions — naming, file organization, error handling, testing patterns, imports, formatting, git workflow — as a structured JSON fingerprint for downstream rule generation. Use when provisioning project-specific rules/config and you need evidence of how the code is actually written, not just what tech it uses.
level: 2
license: MIT
allowed-tools: Read, Glob, Grep, Bash
---

# Convention Extractor

Detects *how* code is written, as distinct from `stack-detector`'s *what it uses*. A project using camelCase with Result-type error handling needs very different generated rules than one using snake_case with exceptions — getting this wrong makes generated rules actively harmful, not just unhelpful.

## Detection dimensions

Sample 10-20 files across different directories; read actual contents, don't infer from file names alone. Collect 3-5 concrete examples per pattern.

| Dimension | What to record |
|---|---|
| File naming | Per-directory convention (PascalCase/kebab-case/snake_case), test-file pattern, co-located vs. separate |
| Code style | Indentation (spaces/tabs, size), quotes, semicolons, trailing commas, brace style, line length, source of truth (`.prettierrc` etc.) |
| Naming | Variables/functions/classes/interfaces/enums/constants/components/hooks — with concrete examples, not just the rule |
| Error handling | Exceptions vs. Result-types vs. error boundaries; custom error classes; catch-variable naming; API error response shape |
| Testing | Framework, `describe/it` vs. flat `test()`, naming convention, assertion style, mocking style, file location |
| Imports | ESM vs. CJS, grouping order, path aliases, default vs. named preference, type-import style, barrel files |
| File organization | Feature-based vs. type-based vs. flat vs. hybrid; average nesting depth |
| Documentation | JSDoc/TSDoc usage, comment density, TODO convention, README/ADR presence |
| TypeScript config | strict mode, key compiler options, path aliases |
| Git conventions | Branch naming, commit style (conventional or not), PR template, hooks |
| CSS/styling | Approach (Tailwind/CSS Modules/CSS-in-JS/plain), co-location, CSS variables |
| React/JSX (if applicable) | Component style, prop typing, export style, conditional-rendering style |

## Output format

Return **only** the JSON fingerprint:

```json
{
  "detected": true,
  "projectType": "webapp | cli | library | api | mobile | monorepo | unknown",
  "conventions": {
    "fileNaming": { "dominant": "kebab-case", "perType": {}, "exceptions": [], "sampleFiles": [] },
    "codeStyle": { "indentation": "spaces", "indentSize": 2, "quotes": "single", "semicolons": false },
    "naming": { "variables": "camelCase", "functions": "camelCase", "classes": "PascalCase", "examples": {} },
    "errorHandling": { "dominantStyle": "exceptions", "customErrors": true, "errorClasses": [] },
    "testing": { "framework": "vitest", "structureStyle": "describe/it", "fileLocation": "co-located" },
    "imports": { "moduleSystem": "esm", "pathAliases": {}, "typeImports": "inline" },
    "fileOrganization": { "pattern": "feature-based", "depth": 3 },
    "documentation": { "style": "tsdoc", "density": "moderate" },
    "typescript": { "strict": true },
    "git": { "commitStyle": "conventional-commits" },
    "css": { "approach": "tailwind", "version": 4 },
    "react": { "componentStyle": "arrow-functions", "propTyping": "interface Props" },
    "evidence": { "filesChecked": 47, "observations": [], "_warnings": [] }
  }
}
```
Empty/undetectable → `{ "detected": false, "projectType": "empty", "conventions": null }`.

## Rules

- Every dimension gets checked, even if the honest answer is "not detected" or "mixed."
- Include concrete file names and snippets as evidence — a claimed convention with no example isn't verified.
- Note conflicting conventions explicitly (mixed naming across directories) rather than picking whichever is more common and calling it settled.
- Read-only, absolute paths, return as response text (don't save to files).

## Related

- `stack-detector` — the companion pass for technology choices rather than authorial style
- `code-standards-extractor` — produces a human-readable STYLE.md from this same kind of analysis; use that when the deliverable is a document for people rather than a JSON fingerprint for `rule-generator`
- `rule-generator` — consumes this fingerprint to produce `.opencode/rules/*.md` / `.claude/rules/*.md`
