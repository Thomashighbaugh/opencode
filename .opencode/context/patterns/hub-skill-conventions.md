# Pattern: Hub SKILL.md Frontmatter and Routing Table Conventions

**Discovered:** 2026-07-03
**Context:** Hub subcommand invocations were producing giant prompts, and hub SKILL.md files were bloated

## Pattern 1: No YAML Frontmatter on Hub SKILL.md Files

Files in `skills/` with YAML frontmatter (`---\nname: ...\n---`) get loaded as skill context by OpenCode, injecting the entire file content into the prompt. Hub SKILL.md files are **routing manifests**, not skill prompts — they must never have frontmatter.

**Before (caused prompt injection):**
```yaml
---
name: orchestrate
description: Unified entry point for execution patterns
---
# Orchestrate
...
```

**After (correct):**
```markdown
# Orchestrate

Unified entry point for all execution and orchestration patterns.
...
```

**Verification:** `init-project/SKILL.md` never had frontmatter and always worked correctly — confirming frontmatter was the root cause.

## Pattern 2: Compact Routing Table Format

Hub SKILL.md files should use a single compact markdown table for subcommand routing, not individual `### /hub X — Y` subsections with `---` dividers.

**Before (caused agents to regurgitate multiple sections):**
```markdown
### `/orchestrate ralph` — Persistent Loop
**Method:** `ralph` — Keeps working in a loop until...
**Reminder:** ...
**Delegates to:** `ralph` skill

---

### `/orchestrate team` — Coordinated Agents
...
```

**After (compact, parseable, token-efficient):**
```markdown
## Subcommand Routing

| Subcommand | Skill/Delegate | What It Does |
|------------|----------------|--------------|
| `ralph` | `ralph` skill | Persistent loop — keep working until verified complete |
| `team` | `team` skill | N coordinated agents on shared task list |
```

**Impact:** 50-70% line reduction across hub SKILL.md files.

## Pattern 3: Two-Tier Description System

Hub subcommand specs use two description fields with distinct purposes:

| Field | Length | Purpose | Content Rules |
|-------|--------|---------|---------------|
| `description` | ≤80 chars (ideally 50-70) | TUI menu display | No tool names, no buzzwords, self-contained, distinctive |
| `detailedDescription` | Unlimited | Route payload (selected subcommand only) | Can include tools, methodology, steps, state paths |

**Why:** TUI dialogs truncate beyond ~80 chars. The hub name isn't visible in the flat subcommand list, so `description` must be self-contained.

## Pattern 4: Verification After Conversion

When converting SKILL.md to routing table format, verify:
1. No-argument behavior list matches spec labels in `index.ts`
2. Routing table row count matches `import` count in `index.ts`
3. Use `awk` to scope row counting to only the routing table section (between `## Subcommand Routing` and `### Subcommand Behavior`)