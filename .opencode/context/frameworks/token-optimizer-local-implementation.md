---
title: "Local Token Optimizer — feature parity implementation plan"
type: decision
tags: [opencode, token-optimizer, token-efficiency, quality-scoring, compaction, continuity, savings, plugin, implementation-plan]
created: 2026-11-08
updated: 2026-11-08
sources: [context/research/opencode-v2-api/2026-11-06]
status: active
---

# Local Token Optimizer — implementation plan

Status: **approved 2026-11-08**. Implementation started; see "Implementation status" below.

## Implementation status

| Area | State |
| --- | --- |
| Plugin registration, tools, config | Implemented: `plugins/token-optimizer/`, registered in `opencode.jsonc` |
| DB adapter + store | Implemented: read-only `opencode.db`, WAL-safe optimizer store |
| Quality engine | Implemented: MRCR curves, exact fill, six signals, dual composite, warnings |
| Compaction/checkpoints | Implemented: mode instructions, checkpoint capture/prune, post-compaction reset |
| Continuity | Implemented: keyword matcher, data fence, resume intent, lean block, restore savings |
| Pricing/savings | Implemented: static table, exact spend, conservative baseline status, savings ledger. The full upstream cohort/counterfactual mix model remains a parity refinement; the tool never fabricates a positive saving when recent costs are unpriced. |
| Nudges | Implemented: quality, fresh-session, verbosity, loop detection; toast/inject modes |
| Optional | Implemented: bash compression (flag), Context Intel digest, live TUI quality bar |
| Tests | `bun test plugins/token-optimizer` and `tests/plugins/token-optimizer-core.test.ts` pass; full vitest green |

Remaining roll-out: verify in an interactive OpenCode TUI, then enable optional compression if desired.

Target: behavioural parity with `alexgreensh/token-optimizer`'s OpenCode edition
(`token-optimizer-opencode@1.2.2`), implemented as a local OpenCode 2 plugin in this
config. Source read: `opencode/` package, `plugin.ts`, `v2.ts`, `index.ts`, quality,
activity, compaction, continuity, nudges, pricing, savings, storage, tools, util.

Two exclusions only:

| Excluded | Reason |
| --- | --- |
| Dashboard (`token_dashboard`, HTML generator, savings cards, browser launch) | Explicitly out of scope |
| Search-result limiting (`websearch_routing.py`, `tool_search_diagnostic.py`, result caps) | Explicitly out of scope |

Optional items **included** in this plan: bash-output compression, Context Intel
Promotion, live quality bar. Optional items **skipped**: MCP introspection, Memory
Health, Attention Optimizer, JSONL trim/dedup, platform adapters, install/uninstall,
npm packaging, marketplace/release. They are not OpenCode-runtime features and have
no parity claim here.

## Why local implementation differs from upstream

Upstream rebuilds state from plugin hooks plus a per-session SQLite file. This config
already has the authoritative OpenCode database:

```
~/.local/share/opencode/opencode.db
  session_v2  project_id, directory, title, agent, model,
              cost, tokens_input/output/reasoning/cache_read/cache_write,
              time_created/updated/compacting/archived
  message     data JSON: role, tokens, cost, modelID, providerID, time, finish
  part        data JSON: type (text|reasoning|tool|compaction|patch|subtask|
              step-start|step-finish|agent), tool name, state.input/output/status/error
  todo        current task state
```

Consequences:

- Exact context fill, spend, cache hit/write, and per-model usage come from the DB,
  not from event reconstruction.
- Stale reads, bloated results, agent dispatch size, tool mode, and checkpoint data
  are derivable from `part` rows.
- Checkpoints do **not** need to duplicate transcripts or open a DB per session.
- The plugin is a thin ingest + pure-calculation layer. No LLM call is used for any
  metric, checkpoint, score, or nudge decision.

Read the DB read-only (`PRAGMA query_only=ON`, `busy_timeout=3000`), always filter by
`session_id`, and use `part_session_idx`. The DB is ~10 GB and WAL-backed; never scan
without a session/time bound.

## Architecture

```
plugins/token-optimizer/
├── index.ts                    V2 entry: hooks, tool registration, cleanup
├── tui.tsx                     optional live quality bar (Phase 7)
├── src/
│   ├── config.ts               env + optional JSON config, feature gates
│   ├── paths.ts                data dirs, migration from legacy location
│   ├── db/
│   │   ├── opencode.ts         read-only opencode.db adapter
│   │   └── store.ts            small token-optimizer SQLite store
│   ├── ingest/
│   │   ├── sessions.ts         session aggregate + project scoping
│   │   ├── usage.ts            per-message usage/cost, daily/model rollups
│   │   └── parts.ts            tool calls, results, reads, writes, texts, agents
│   ├── quality/
│   │   ├── curves.ts           MRCR family tables + interpolation
│   │   ├── signals.ts          stale reads, bloat, density, agent efficiency
│   │   ├── score.ts            dual composite, grades, monotonicity
│   │   └── warnings.ts         fill/tool-call/regime thresholds
│   ├── activity/
│   │   ├── classify.ts         tool buckets, session mode detection
│   │   └── intel.ts            large-output marker/rate limit
│   ├── compaction/
│   │   ├── instructions.ts     mode-aware PRESERVE/DROP map
│   │   └── checkpoint.ts       capture, prune, content sanitization
│   ├── continuity/
│   │   ├── matcher.ts          keyword scoring, data-fence neutralization
│   │   ├── resume.ts           resume intent, lean reconstruction, project scope
│   │   └── inject.ts           restore selection + context payload
│   ├── nudges/
│   │   ├── quality.ts          drop/critical thresholds, cooldown, cap
│   │   ├── fresh.ts            fresh-session decision + token economics
│   │   ├── verbosity.ts        tiered verbosity steer
│   │   └── loop.ts             Jaccard loop detection
│   ├── pricing/
│   │   ├── table.ts            static model cards, date gates, route normalization
│   │   └── rates.ts            blended class rates, premium mix
│   ├── savings/
│   │   ├── baseline.ts         onboarding/early/after cohort math
│   │   ├── counterfactual.ts   same-volume reprice, cache-hit, premium share
│   │   ├── events.ts           savings ledger
│   │   └── report.ts           compact report for tool/status
│   ├── redact.ts               credential/PII scrub at write boundary
│   ├── text.ts                 truncation, neutralization, safe formatting
│   └── tools/
│       ├── register.ts         ctx.tool.transform registration
│       ├── status.ts           token_status
│       └── optimizer.ts        tokenOptimizer action router
└── test/
    ├── unit/                   pure functions and algorithms
    ├── integration/            synthetic DB + tool execution
    ├── parity/                 fixed expected outputs from documented constants
    └── fixtures/               synthetic sessions/parts, no copied source
```

Data locations:

| Data | Path | Git |
| --- | --- | --- |
| OpenCode DB | `$OPENCODE_DB` or `~/.local/share/opencode/opencode.db` | external |
| Token Optimizer store | `~/.local/share/opencode/token-optimizer/optimizer.db` | outside repo |
| Config override | `~/.config/opencode/token-optimizer.json` | user config |
| Legacy migration | `~/.local/share/token-optimizer/` → new path on first run | one-way copy |
| Project checkpoints | stored in the central store, scoped by `project_id` | outside repo |

No writes into a project directory by default. `dataDir` may be overridden by env or
config; if it lands inside a repo, document the gitignore requirement.

## Store schema

```sql
quality_cache(
  session_id TEXT PRIMARY KEY,
  resource_health REAL,
  session_efficiency REAL,
  fill_pct REAL,
  tool_calls INTEGER,
  compactions INTEGER,
  score_version INTEGER,
  data_json TEXT,
  updated_at REAL NOT NULL
)

checkpoints(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  project_id TEXT,
  directory TEXT,
  trigger TEXT NOT NULL,
  mode TEXT,
  quality_score REAL,
  fill_pct REAL,
  active_files_json TEXT,
  decisions_json TEXT,
  content TEXT NOT NULL,
  raw_bytes INTEGER NOT NULL,
  created_at REAL NOT NULL
)
CREATE INDEX checkpoints_project_time ON checkpoints(project_id, created_at DESC);

savings_events(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd REAL NOT NULL DEFAULT 0,
  session_id TEXT,
  model TEXT,
  detail TEXT,
  created_at REAL NOT NULL
)
CREATE INDEX savings_events_time ON savings_events(created_at DESC);

meta(key TEXT PRIMARY KEY, value TEXT NOT NULL)
```

`quality_cache.data_json` holds score version, compactions, recovery status, and any
merged decisions; it never replaces the DB as the source of truth.

## Tool surface

Deliberately small. One umbrella tool plus the parity `token_status`.

### `token_status`

Input: `{ detail?: boolean, sessionID?: string }`

Output: Markdown report with ResourceHealth, SessionEfficiency, estimated fill,
band, activity mode, tool calls, compactions, warnings, optional signal table.
Read-only; no model call; safe to call repeatedly.

### `tokenOptimizer`

Input: `{ action, ... }`

| Action | Input | Output |
| --- | --- | --- |
| `quality` | `{ detail?, sessionID? }` | Same computation as token_status |
| `savings` | `{ days? }` | Measured spend, savings events, baseline status |
| `checkpoint` | `{ action: capture\|list\|prune, sessionID?, limit? }` | Checkpoint rows or write confirmation |
| `resume` | `{ prompt?, sessionID?, dryRun? }` | Selected checkpoint / lean block, no injection unless asked |
| `mode` | `{ sessionID? }` | Classified mode + recent tool buckets |
| `history` | `{ days?, project? }` | Session rows with quality, usage, cost, mode |

No `token_dashboard`. `tokenOptimizer` actions all return compact text/tables, not JSON
blobs, to keep tool-result tokens bounded.

## Hook wiring

| Hook | Work | Inference cost |
| --- | --- | --- |
| `ctx.tool.transform` | Register `token_status`, `tokenOptimizer` | 0 |
| `ctx.tool.hook("execute.before")` | Update in-memory operation ring: file read, call index | 0 |
| `ctx.tool.hook("execute.after")` | Update ring: write path, result size, failure, agent prompt/result size; feed large-output marker; optional compression counter | 0 |
| `ctx.session.hook("prompt")` | Capture first prompt for continuity; maintain last-10 prompt ring; trigger loop check | 0 |
| `ctx.session.hook("context")` | Optional nudge/restore injection only; default no-op | paid only when injecting |
| `ctx.session.hook("compaction")` | Build mode instructions + checkpoint; push to `event.result.summary` or `event.system` | paid once per compaction |
| `ctx.event.subscribe` | `session.idle` flush; `session.deleted` final checkpoint/prune; `session.compaction.ended` reset | 0 |
| `ctx.shell.hook("create.before")` | Set `TOKEN_OPTIMIZER_RUNTIME=opencode` | 0 |
| cleanup | abort event loop, close DB handles, flush caches | 0 |

Live hooks are a convenience, not the source of truth. If a hook is missed or replayed,
SQL over `opencode.db` still produces the same result on the next call.

## Configuration

Environment first, optional JSON file second. No change to the existing `plugin`
directory-string array in `opencode.jsonc`.

| Variable | Default | Purpose |
| --- | --- | --- |
| `TOKEN_OPTIMIZER_DATA_DIR` | `~/.local/share/opencode/token-optimizer` | store location |
| `TOKEN_OPTIMIZER_QUALITY_WINDOW` | 20 | rolling signal window |
| `TOKEN_OPTIMIZER_TOOL_CALL_WARN` | auto | warn threshold |
| `TOKEN_OPTIMIZER_TOOL_CALL_CRITICAL` | auto | critical threshold |
| `TOKEN_OPTIMIZER_CHECKPOINT_RETENTION_DAYS` | 7 | retention |
| `TOKEN_OPTIMIZER_CHECKPOINT_RETENTION_MAX` | 50 | scan cap |
| `TOKEN_OPTIMIZER_RELEVANCE_THRESHOLD` | 0.6 | continuity match floor |
| `TOKEN_OPTIMIZER_CHECKPOINT_MAX_CHARS` | 2000 | restore cap |
| `TOKEN_OPTIMIZER_NUDGES` | `inject` | `off`, `toast`, or `inject` |
| `TOKEN_OPTIMIZER_LOOP_DETECTION` | true | loop check |
| `TOKEN_OPTIMIZER_SMART_COMPACTION` | true | compaction instructions |
| `TOKEN_OPTIMIZER_CONTINUITY` | true | checkpoint restore |
| `TOKEN_OPTIMIZER_ACTIVITY` | true | mode tracking |
| `TOKEN_OPTIMIZER_TRENDS` | true | savings/session history |
| `TOKEN_OPTIMIZER_BASH_COMPRESSION` | false | optional Phase 7 |

Default nudge mode is `toast`, not `inject`: compute identically, spend zero prompt
tokens, and let the user ask for injection. `inject` reproduces upstream behaviour.

## Phases and tasks

Every task ends with a verification command or an assertion. No task is "done" without
its test passing.

### Phase 0 — Foundation

| ID | Task | Files | Acceptance |
| --- | --- | --- | --- |
| P0.1 | Package skeleton, V2 entry, feature gates | `index.ts`, `src/config.ts`, `src/paths.ts` | `opencode2` loads plugin; no config change; `token_status` returns "no data" cleanly |
| P0.2 | Read-only OpenCode DB adapter | `src/db/opencode.ts` | Synthetic DB fixture: session, messages, parts read correctly; query-only enforced; 10 GB DB query bounded by session |
| P0.3 | Token optimizer store + migrations | `src/db/store.ts`, `src/paths.ts` | Fresh DB creates schema; rerun is idempotent; legacy data copied once |
| P0.4 | Redaction + safe formatting | `src/redact.ts`, `src/text.ts` | Credential/control-char fixtures scrubbed; no secret reaches checkpoint/savings rows |
| P0.5 | Tool registration + action router | `src/tools/register.ts`, `src/tools/status.ts`, `src/tools/optimizer.ts` | Tools appear in `GET /api/tool`; invalid action returns a bounded error, not a throw |

### Phase 1 — Quality engine

| ID | Task | Files | Acceptance |
| --- | --- | --- | --- |
| P1.1 | MRCR curves + interpolation + model family selection | `quality/curves.ts` | Boundary and midpoint fixtures for Anthropic, GPT-5.5, GPT-5, GPT-4.1, Gemini |
| P1.2 | Context-window lookup | `quality/curves.ts` or `src/model-windows.ts` | 30+ known model IDs resolve; unknown falls back safely |
| P1.3 | Fill estimate from DB | `ingest/usage.ts`, `quality/score.ts` | Exact: last assistant input + cache read/write, divided by window; synthetic DB matches expected |
| P1.4 | Stale-read signal | `quality/signals.ts`, `ingest/parts.ts` | Read-before-write, read-then-far-write, re-read cases; counts/waste match fixtures |
| P1.5 | Bloated-result signal | `quality/signals.ts` | >4000-char result referenced vs unreferenced within 10 ops; count/waste match |
| P1.6 | Decision density + agent efficiency | `quality/signals.ts` | Substantive threshold, window ratio, Task prompt/result ratio |
| P1.7 | Absolute waste + compaction metadata | `quality/score.ts` | Waste sum and compaction count; recovery reported unmeasurable, not scored |
| P1.8 | Dual composite, grades, monotonicity | `quality/score.ts` | Weights exactly `5/7 + 2/7` and `0.3/0.3/0.2/0.2`; clamp until compaction |
| P1.9 | Quality cache + 2-minute throttle | `db/store.ts`, `quality/score.ts` | Repeat call within throttle returns cached; new message invalidates |
| P1.10 | Fill/tool-call/regime warnings | `quality/warnings.ts` | 75/85, 50% fill, scaled tool thresholds |
| P1.11 | `token_status` report | `tools/status.ts` | Report renders all fields; detail table bounded |

### Phase 2 — Activity and live state

| ID | Task | Files | Acceptance |
| --- | --- | --- | --- |
| P2.1 | Tool classification into buckets | `activity/classify.ts` | read/write/edit/task/shell buckets match fixture tool names |
| P2.2 | Mode detection | `activity/classify.ts` | code/debug/review/infra/general cases from tool windows and errors |
| P2.3 | Operation ring for live turns | `index.ts` | before/after hook records read/write/result/failure; no DB write per call |
| P2.4 | Large-output marker | `activity/intel.ts` | 3 per 5 minutes cap; pure |
| P2.5 | Session idle/deleted lifecycle | `index.ts` | Idle flushes cache; delete checkpoints + prunes; replay is idempotent |
| P2.6 | Usage/event adapter | `ingest/usage.ts` | DB exact usage; event subscription only invalidates cache, never becomes source of truth |

### Phase 3 — Compaction and checkpoints

| ID | Task | Files | Acceptance |
| --- | --- | --- | --- |
| P3.1 | Mode instruction map | `compaction/instructions.ts` | Five modes, exact PRESERVE/DROP categories |
| P3.2 | Checkpoint capture | `compaction/checkpoint.ts` | Reads/writes, active files ≤15, mode, quality, fill, topic summary |
| P3.3 | Checkpoint sanitization | `compaction/checkpoint.ts`, `src/redact.ts` | Paths/topics/decisions scrubbed; no forged XML/role instructions |
| P3.4 | Checkpoint persistence + prune | `db/store.ts` | Retention days, keep newest 3, scan cap; idempotent |
| P3.5 | Compaction hook | `index.ts` | Pushes instructions/checkpoint into `event.result.summary` or `event.system`; native compaction still owns summarization |
| P3.6 | Post-compaction reset | `index.ts` | Compaction count increments; quality cache and signal accumulators reset |

### Phase 4 — Continuity

| ID | Task | Files | Acceptance |
| --- | --- | --- | --- |
| P4.1 | Keyword matcher | `continuity/matcher.ts` | Stopwords, word-level membership, 0.6 floor, truncation |
| P4.2 | Data-fence neutralization | `continuity/matcher.ts` | C0 controls stripped; forged RECOVERED sentinels and role prefixes defanged |
| P4.3 | Checkpoint scan + project scope | `continuity/resume.ts` | Same project only; newest-first; excludes current session; corrupt DB skipped |
| P4.4 | Resume intent | `continuity/resume.ts` | Multilingual continue/resume regex; explicit no-match does not leak another project |
| P4.5 | Resume-lean block | `continuity/resume.ts` | Topic score, cross-project path drop, 3500-char cap, disclosure line |
| P4.6 | Continuity injection | `continuity/inject.ts`, `index.ts` | First prompt only; wrapped as untrusted data; failure never breaks turn |
| P4.7 | Savings credits | `savings/events.ts` | checkpoint_restore bytes/3.3 capped 200K; resume_lean credit |

### Phase 5 — Pricing, spend, savings

| ID | Task | Files | Acceptance |
| --- | --- | --- | --- |
| P5.1 | Pricing table + normalization | `pricing/table.ts` | Claude/OpenAI/Gemini/DeepSeek/Qwen/Mistral/xAI families; provider/route/proxy prefixes; Sonnet date gate |
| P5.2 | Blended class rates | `pricing/rates.ts` | input/output/cacheRead/cacheWrite; premium model mix |
| P5.3 | Per-message spend | `ingest/usage.ts` | DB exact; no double count on replay |
| P5.4 | Session/daily/model aggregates | `ingest/sessions.ts`, `ingest/usage.ts` | SQL group-bys match fixture; `undated` handled explicitly |
| P5.5 | Savings event ledger | `savings/events.ts`, `db/store.ts` | Append and query by window/type; unpriced tokens counted separately |
| P5.6 | Baseline cohort math | `savings/baseline.ts` | Onboarding 1d, early 30d/30 sessions, after 10 sessions, merged days |
| P5.7 | Counterfactual/premium/cache-hit | `savings/counterfactual.ts` | Same-volume reprice; premium share; before/after cache hit; allocation cents |
| P5.8 | Realized savings report | `savings/report.ts`, `tools/optimizer.ts` | Baseline-building status vs ready; measured vs estimated kept separate |
| P5.9 | Compression accounting | `savings/events.ts` + toon integration | Byte/token delta recorded only when compression actually applied |

### Phase 6 — Nudges and surfaces

| ID | Task | Files | Acceptance |
| --- | --- | --- | --- |
| P6.1 | Quality nudge | `nudges/quality.ts` | >15 drop or <60 cross; 5-min cooldown; 3/session cap |
| P6.2 | Fresh-session nudge | `nudges/fresh.ts` | Fill ≥50, score <70, once, continuity on, ≥300K absolute tokens; economics bounded |
| P6.3 | Verbosity steer | `nudges/verbosity.ts` | 25/75/90 tiers; shared cooldown; suppressed at 90 |
| P6.4 | Loop detection | `nudges/loop.ts` | 3 similar of last 10; Jaccard 0.6; no false substring match |
| P6.5 | Nudge dispatch | `index.ts`, `tui.tsx` | `toast` default; `inject` optional; one compact line; never every turn |
| P6.6 | TUI live quality bar | `tui.tsx` | Sidebar/footer reads store; zero inference; refresh on idle |

### Phase 7 — Optional features

These are not skipped. They are lower priority than parity and ship after Phases 0–6.

| ID | Task | Files | Acceptance |
| --- | --- | --- | --- |
| P7.1 | Bash-output compression | `plugins/toon` + `src/savings/events.ts` | Deterministic compression of large shell output: ANSI strip, duplicate-line collapse, head/tail; errors never truncated; before/after bytes/tokens logged; flag defaults off |
| P7.2 | Context Intel Promotion | `compaction/checkpoint.ts`, `src/tools/optimizer.ts` | Post-compaction digest of top tool results by recency/unreferenced status; deterministic; stored in checkpoint; injectable only after compaction |
| P7.3 | Live quality bar | `tui.tsx` | Persistent status line/sidebar with score, fill, mode, warnings; no prompt injection |

### Phase 8 — Hardening and rollout

| ID | Task | Acceptance |
| --- | --- | --- |
| P8.1 | Parity fixture suite | Expected outputs for every pure function from documented constants, not copied source |
| P8.2 | Synthetic DB integration suite | Temp DB with session/message/part rows; tools and hooks produce exact expected output |
| P8.3 | Hook lifecycle suite | Register/unregister, replay dedup, missing event, aborted event loop, dispose |
| P8.4 | Large-DB performance | Every query uses session/time bound; `EXPLAIN QUERY PLAN` shows index use; status under 100 ms on local DB |
| P8.5 | Security/privacy | No secrets in store; checkpoint injection fenced; no project writes by default; path traversal ignored |
| P8.6 | Docs | `README` section, config table, tool descriptions, exclusion note |
| P8.7 | Rollout | Enable plugin in a test session; compare status against DB ground truth; then keep enabled |

## Parity traceability

Every upstream OpenCode feature maps to a task:

| Feature group | Tasks |
| --- | --- |
| V2 entry, tools, shell marker, cleanup | P0.1, P0.5, P2.5 |
| Config/env/dataDir/migration | P0.1, P0.3 |
| Per-project scoping, redaction, retention | P0.3, P0.4, P3.4 |
| Context fill + model windows + MRCR | P1.1–P1.3 |
| Stale reads, bloat, density, agent efficiency, waste | P1.4–P1.7 |
| Composite, grades, monotonicity, cache, warnings | P1.8–P1.10 |
| Tool call fatigue, regime notice | P1.10 |
| Quality/fresh/verbosity/loop nudges | P6.1–P6.5 |
| Large-output marker, activity tracking/mode | P2.1–P2.4 |
| Compaction instructions, checkpoint, prune, reset | P3.1–P3.6 |
| Continuity matcher, neutralization, resume-lean, injection | P4.1–P4.6 |
| Usage/cost, pricing, aggregates, savings, ledger | P5.1–P5.9 |
| `token_status` | P1.11 |
| Dashboard + `token_dashboard` | excluded |
| Search-result limiting | excluded |
| Bash compression, Context Intel, live quality bar | P7.1–P7.3 |

## Verification commands

```bash
# unit + integration
bunx vitest run tests/plugins/token-optimizer

# type/syntax
bunx tsc --noEmit

# headless plugin load (fresh DB, no user data)
OPENCODE_DB=/tmp/token-optimizer-test.db opencode2 serve --port 4096 --print-logs

# tool inventory
opencode2 api GET /api/tool

# synthetic query bound check
sqlite3 "$DB" "EXPLAIN QUERY PLAN SELECT ... WHERE session_id = ?"
```

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| 10 GB DB makes naive queries slow | session/time-bound SQL, indexes, cache; never global scans |
| WAL contention or locked DB | read-only connection, `busy_timeout`, retry once, fail open |
| Hook ordering differs from V1 | DB remains source of truth; hooks only accelerate |
| Prompt injection via checkpoint | data fence + neutralization + redaction; restore is context, never instructions |
| Nudge spam / prompt bloat | default toast mode, shared cooldown, 3/session cap, 90% suppression |
| Multiple plugins mutate tool results (`toon`, token optimizer) | compression lives in `toon` only; token optimizer records deltas, never rewrites results |
| Pricing drift | static table plus optional `prices` tool; no network in hot path |
| Upstream license | clean-room behavioural implementation; no copied source; noncommercial caveat recorded |

## Approval gate

Plan approval means authorizing Phases 0–8 as scoped above, including optional Phases
7.1–7.3. Exclusions remain the dashboard and search-result limiting. On approval,
implementation proceeds phase by phase with tests at each gate; no phase is skipped,
and any discovered parity gap returns here as a plan amendment rather than silently
scope-cutting.
