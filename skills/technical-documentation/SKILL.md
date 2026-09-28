---
name: technical-documentation
description: Write accurate technical documentation — API docs, architecture docs, user guides, code comments — with every example and command actually tested before it's included. Use for docs beyond a README (use crafting-effective-readmes for that specifically).
level: 2
license: MIT
---

# Technical Documentation

Inaccurate documentation is worse than none — it actively misleads and costs a reader more time than they'd have spent guessing. Every code example and every command in the output must be verified to actually work before it's included, not written from memory of what the API "should" look like.

## Process

1. Parse the request to identify the exact documentation task — don't drift into documenting adjacent features.
2. Explore the codebase in parallel (Glob/Grep/Read) to find what's actually being documented, not what it used to do.
3. Study existing documentation for style and structure, and match it.
4. Write, with every code example and command included only after testing it.
5. Report what was tested and what wasn't (and why, if something couldn't be).

## Rules

- Document precisely what's requested — nothing more, nothing less.
- Active voice, direct language, no filler.
- Scannable structure: headers, code blocks, tables, bullets — not walls of prose.
- This is an authoring pass only: don't self-review or claim reviewer sign-off in the same pass. If review is requested, that's a separate pass.
- If an example genuinely can't be tested (e.g. requires infra not present), say so explicitly rather than including it silently.

## Output format

```
COMPLETED TASK: [description]
STATUS: SUCCESS / FAILED / BLOCKED

FILES CHANGED:
- Created: [...]   Modified: [...]

VERIFICATION:
- Code examples tested: X/Y working
- Commands verified: X/Y valid
```

## Related

- `crafting-effective-readmes` — specifically for README structure/audience-matching
- `readme-updater` — for syncing an existing README against current code
- `professional-communication` — for non-code technical writing (emails, PR descriptions, meeting notes)
