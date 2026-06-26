---
name: adr-skill
description: Create and maintain Architecture Decision Records (ADRs) optimized for agentic coding workflows. Use when you need to propose, write, update, accept/reject, deprecate, or supersede an ADR; consult existing ADRs before implementing changes; or enforce ADR conventions. This skill uses structured interviewing to capture intent before drafting, and validates output against an agent-readiness checklist.
---

# ADR Skill

## Philosophy

ADRs created with this skill are **executable specifications for coding agents**. A human approves the decision; an agent implements it. The ADR must contain everything the agent needs to write correct code without asking follow-up questions.

- Constraints must be explicit and measurable
- Decisions must be specific enough to act on
- Consequences must map to concrete follow-up tasks
- Non-goals must be stated to prevent scope creep
- The ADR must be self-contained — no tribal knowledge assumptions
- The ADR must include an implementation plan — which files to touch, patterns to follow, tests to write, verification criteria

## When to Write an ADR

Write an ADR when a decision:
- **Changes how the system is built or operated** (new dependency, architecture pattern, infrastructure choice, API design)
- **Is hard to reverse** once code is written against it
- **Affects other people or agents** who will work in this codebase later
- **Has real alternatives** that were considered and rejected

Do NOT write an ADR for:
- Routine implementation choices within an established pattern
- Bug fixes or typo corrections
- Decisions already captured in an existing ADR (update it instead)
- Style preferences already covered by linters or formatters

## Creating an ADR: Four-Phase Workflow

### Phase 0: Scan the Codebase

Before asking any questions, gather context:
1. Find existing ADRs — check `contributing/decisions/`, `docs/decisions/`, `adr/`, `docs/adr/`, `decisions/`
2. Check the tech stack — read `package.json`, `go.mod`, `requirements.txt`, or equivalent
3. Find related code patterns — scan for existing implementations affected by the decision
4. Check for ADR references in code comments

### Phase 1: Capture Intent

Interview the human to understand the decision space. Ask questions one at a time:

1. **What are you deciding?** — Get a short, specific title
2. **Why now?** — What broke, what's changing, or what will break if you do nothing?
3. **What constraints exist?** — Tech stack, timeline, budget, compliance
4. **What does success look like?** — Measurable outcomes
5. **What options have you considered?** — At least two, with core tradeoffs
6. **What's your current lean?** — Capture gut intuition
7. **What would an agent need to implement this?** — Files affected, patterns to follow, tests to write

**Intent Summary Gate:** Before moving to Phase 2, present a structured summary and ask the human to confirm or correct it.

### Phase 2: Draft the ADR

1. Choose the ADR directory (existing one, or create `contributing/decisions/` or `docs/decisions/` or `adr/`)
2. Choose filename strategy (date prefix or slug-only, match existing convention)
3. Fill every section from the confirmed intent summary — no placeholder text
4. Write the Implementation Plan — tells the next agent exactly what to do
5. Write Verification criteria as checkboxes

### Phase 3: Review Against Checklist

Review the ADR for agent-readiness:
- Context self-contained?
- Implementation plan covers affected files?
- Verification criteria are specific and checkable?
- No ambiguous requirements?

If there are gaps, propose specific fixes. Do not finalize until the ADR passes or the human explicitly accepts the gaps.

## Consulting ADRs (Read Workflow)

Before implementing changes, check for existing ADRs:
1. Find the ADR directory
2. Scan titles and statuses — focus on `accepted` ADRs
3. Read relevant ADRs fully — including the Implementation Plan
4. Respect the decisions — don't contradict without a new ADR
5. Follow the Implementation Plan patterns

## Code ↔ ADR Linking

When implementing code guided by an ADR, add a comment referencing it:
```typescript
// ADR: Using better-sqlite3 for test database
// See: docs/decisions/2025-06-15-use-sqlite-for-test-database.md
```

## ADR Template

```markdown
# [Title]

**Status:** [proposed | accepted | deprecated | superseded]
**Date:** [YYYY-MM-DD]
**Supersedes:** [optional: link to superseded ADR]

## Context
[What's happening that forces this decision?]

## Decision
[What are we doing? Be specific.]

## Options Considered
| Option | Pros | Cons |
|--------|------|------|
| Option A | ... | ... |
| Option B | ... | ... |

## Consequences
[What becomes easier/harder? What follow-up tasks are created?]

## Implementation Plan
- **Affected paths**: [files/directories]
- **Pattern**: [how to implement]
- **Tests**: [what to test]

## Verification
- [ ] [Specific, checkable criterion]
- [ ] [Specific, checkable criterion]

## More Information
[Additional context, date-stamped updates]
```
