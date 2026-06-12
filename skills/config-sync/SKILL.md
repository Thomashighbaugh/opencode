---
name: config-sync
description: Synchronize opencode.jsonc with the latest OpenCode config schema from Context7. Checks schema, detects drift, and updates config to remain compliant.
level: 3
---

# Config Sync

Enforce that `opencode.jsonc` stays compliant with the latest OpenCode configuration schema.

## Why This Exists

OpenCode's config schema evolves. Keys get deprecated (`mode` → `agent`, `autoshare` → `share`), new keys are added (`tool_output`, `compaction`, `experimental.policies`), and invalid keys that don't exist in the schema can silently cause config load failures.

This skill fetches the latest schema from `https://opencode.ai/config.json`, compares it against the current config, and reports any compliance issues.

## When to Use

- After OpenCode updates
- When config load errors occur
- Before major config changes
- As part of `/project audit`

## Workflow

### 1. Fetch Current Schema
Fetches `https://opencode.ai/config.json` via web fetch and extracts valid top-level keys, deprecated keys, and new additions.

### 2. Compare Against Local Config
Reads `opencode.jsonc`, parses all top-level keys, and checks:
- Each key exists in schema → valid
- Each key is not `@deprecated` → warn if still used
- No unknown/invalid keys present → flag as error

### 3. Report & Fix
- Reports all issues grouped by severity (error, warning, info)
- Can auto-fix: remove deprecated keys, add recommended missing keys
- Saves schema to `.opencode/context/research/opencode-config-schema.md` for offline reference

## Script

`scripts/check-schema-compliance.mjs` — Standalone compliance checker

```
node scripts/check-schema-compliance.mjs         # Check only
node scripts/check-schema-compliance.mjs --fix    # Auto-fix issues
node scripts/check-schema-compliance.mjs --save   # Save schema to context
```

## Cached Schema

The last-fetched schema is stored at:
`.opencode/context/research/opencode-config-schema.md`

This serves as the durable reference and diff baseline.