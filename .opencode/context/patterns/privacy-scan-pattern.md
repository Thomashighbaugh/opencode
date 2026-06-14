# Privacy Scan Pattern

## Problem
Context files saved to `.opencode/context/` (committed to git) may inadvertently contain secrets, API keys, PII, or privacy-compromising content from session data.

## Solution
A two-pronged approach:

1. **Preventive**: `.gitignore` entries for known sensitive paths (`.opencode/state/sessions/`, `.opencode/chat-history/`, `.opencode/chat/`)
2. **Dynamic**: A `privacy-scan` skill that scans content before it's saved to `.opencode/context/`, classifying risk as HIGH/MEDIUM/LOW/UNCERTAIN and routing accordingly

## Key Design Decisions

### Derived Knowledge vs Raw Data
The scan distinguishes between:
- **Derived knowledge** (safe to commit): ADRs, pattern descriptions, architectural decisions, lessons learned, summaries, code snippets without credentials
- **Raw data** (risky): Full session transcripts, raw logs, environment dumps, config files with real values, API responses

Heuristics check for indicators like `# Architecture Decision`, `## Rationale`, `## Lessons Learned` to identify derived knowledge.

### Risk Routing
| Risk | Action |
|------|--------|
| HIGH | Add to `.gitignore`, save to `.opencode/state/` (gitignored) |
| MEDIUM | Save to `.opencode/state/` for human review |
| LOW | Save to `.opencode/context/` as normal durable context |
| UNCERTAIN | Save to `.opencode/state/` for human review |

## Integration Points
- `init-project` Phase 3: Adds gitignore entries + runs privacy scan during setup/refresh
- `init-project` Phase 8: Verifies gitignore entries exist
- `harvest-context`: Runs privacy scan before saving any file to `.opencode/context/`
- `harvest-context sweep`: Scans existing context files for privacy issues
- `rules/context-strategy.md`: Documents the privacy scan integration

## Files
- `skills/privacy-scan/SKILL.md` — Skill definition
- `skills/privacy-scan/scripts/scan-privacy.mjs` — Executable scan script
