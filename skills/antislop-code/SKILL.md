---
name: antislop-code
description: Code comment slop filter — remove generic AI comments, keep the valuable ones
level: 3
license: MIT
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

# antislop-code — Code Comment Slop Filter

Load this skill when the AI writes or reviews code comments. It removes the ones an AI adds out of habit and keeps the ones that carry information.

Complements `ai-slop-cleaner` (which handles code structure slop — duplication, dead code, needless abstraction). This skill handles comment slop only; it never touches code behavior.

The core antislop rules (`rules/antislop.md`) always apply first. This skill adds depth; it references the core rules by number and never duplicates them.

## What it covers

| Area | Core rules |
|------|------------|
| Comments That Add Nothing | R-31 every decision needs a written reason; comments must carry information |
| How It Should Read | R-31, R-16 no AI buzzwords in comments |

## Pattern table — name it, reject it

| Pattern | Telltale signs | Action |
|---------|---------------|--------|
| Decorative Separators | `// =================`, `// ----- Section -----` | Remove |
| Restating the Obvious | `// increment i by 1` next to `i++` | Remove |
| Workflow Narration | `// now we call the API`, `// then we return` | Remove |
| Empty Labels | `// TODO:`, `// FIXME:` with no context | Keep only if actionable |
| Vague Placeholders | `// do something here`, `// magic happens` | Remove |
| Signature Echo | `// function that does X` repeating the signature | Remove |
| Decorative Emoji | `// 🚀`, `// ✅` in comments | Remove |
| End Markers | `// end of function`, `// end of class` | Remove |
| Over-Explained Comment | paragraph explaining self-evident code | Condense to one line |
| Line-by-Line Narration | comment on every line | Remove, keep only non-obvious lines |
| Stiff or Loud Wording | AI buzzwords in comments ("revolutionary", "seamless") | Rewrite plainly (R-16) |

## How comments should read

- A comment exists to explain **why**, not **what** (the code already says what).
- Every major decision needs a one-line written reason (R-31): why this color, layout, algorithm, trade-off.
- If the reason cannot be written in one line, the decision is not valid — revisit it.
- Never use AI marketing buzzwords in comments (R-16).
- Keep comments that carry information; delete comments that restate code.

## Never touch code

This skill only edits comments. It does not change behavior, logic, structure, or APIs. For code-structure slop cleanup, use `ai-slop-cleaner` instead.
