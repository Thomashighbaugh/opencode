---
name: insights
description: Generate a session-history analysis report from local OpenCode history — work patterns, tool usage, friction points, and strategic recommendations. Use when the user asks for insights, productivity analysis, retrospective of recent work, "what have I been working on", friction analysis, or "what should I improve". Complements session-memory (browse) with analysis (synthesize).
license: MIT
compatibility: Requires sqlite3 CLI and the same DB discovery as the session-memory skill.
---

# OpenCode Insights Analyst

Analyze the user's OpenCode session history and produce a structured insights report: what was
worked on, how tools were used, where friction happened, and what to do next.

## Role

Elite Developer Productivity Analyst. Goal: turn raw session history into an actionable
"OpenCode Insights" report.

## Capabilities

Analyze and report on:

1. **Work Patterns** — which projects/modules the user worked on, session clustering.
2. **Tool Usage** — which tools (bash, edit, read, task, etc.) were used and how.
3. **Friction Points** — errors, interruptions, user rejections, "babysitting" moments, repeated retries.
4. **Strategic Horizons** — suggested workflows, automations, and skills based on actual usage.

## Workflow

### 1. Data Gathering

Reuse the session-memory skill's setup and queries to pull the raw data:

```bash
DATA_ROOT="${XDG_DATA_HOME:-$HOME/.local/share}/opencode"
STATE_ROOT="${XDG_STATE_HOME:-$HOME/.local/state}/opencode"
DB="$(opencode db path 2>/dev/null || true)"
[ -n "$DB" ] || DB="${OPENCODE_DB:-$DATA_ROOT/opencode.db}"
case "$DB" in :memory:|/*) ;; *) DB="$DATA_ROOT/$DB" ;; esac
if [ ! -f "$DB" ]; then
  for candidate in "$DATA_ROOT"/opencode*.db; do
    [ -f "$candidate" ] && DB="$candidate" && break
  done
fi
DB_URI="file:${DB}?mode=ro"
```

Default scope: last 20 main sessions or last 2 weeks (whichever is larger). If the user provides a
specific range or session ID, focus on that.

- **Session list**: recent main sessions with titles, projects, message counts, update times.
- **Per-session transcripts**: text parts of the sessions in scope.
- **Error/failure signals**: search text parts for error markers (`error`, `failed`, `rejected`,
  `timeout`, `refused`, `denied`) and count occurrences per session.

### 2. Analysis Phase

Extract from the raw logs:

- **Stats**: total messages, estimate lines changed (sum Edit/Write patches), files touched,
  active days, sessions per project.
- **Project Areas**: cluster sessions into 3-5 main topics (e.g., "Admin API", "Refactoring",
  "Documentation", "Config tuning").
- **Wins**: successful complex tasks (multi-file edits, long autonomous runs, completed
  orchestrations) — evidence from transcripts, not vibes.
- **Friction**: categorize failures (API errors, tool failures, ambiguous requests requiring
  restarts, user rejections, repeated retry loops). Count per category.
- **Horizon**: propose specific next steps grounded in the data — e.g. "a skill for X would save
  the 5 times/week you do Y", "use TodoWrite for Z", "the repeated prompt-error pattern suggests
  updating rule R".

### 3. Report Generation

Write a structured markdown report to `.opencode/state/insights/insights-{YYYYMMDD}.md` with this
shape:

```markdown
# OpenCode Insights — {date}

Coverage: N sessions across M projects, {range}.

## Stats
| Metric | Value |
|--------|-------|
| Messages | ... |
| Files touched (est.) | ... |
| Active days | ... |

## Project Areas
1. **Topic** — sessions, what was done
2. ...

## Big Wins
- (evidence-backed achievements)

## Friction
| Category | Count | Examples |
|----------|-------|----------|
| Tool failures | | |
| API/network errors | | |
| Ambiguous requests | | |
| Retry loops | | |

## Strategic Horizons
- Concrete, data-grounded recommendations (skills to create, workflows to automate, rules to update).
```

## Output

- The report file at `.opencode/state/insights/insights-{YYYYMMDD}.md`.
- A brief summary in the chat: coverage (N sessions), top 2-3 findings, and the top recommendation.

## Rules

- Read-only on the DB (always `?mode=ro`). Never modify OpenCode DB/files.
- Evidence over vibes — every claim in Wins/Friction must trace to transcript text.
- Do not dump raw history into the report; synthesize.
- Friction categories must map to actionable fixes, not just complaints.
