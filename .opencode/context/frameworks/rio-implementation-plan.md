# Rio Implementation Plan — remote_inference_endpoint_optimizations

## Core constraints (non-negotiable)
- Plugin name: `remote_inference_endpoint_optimizations` (id: `remote_inference_endpoint_optimizations`)
- Single access point: hub-like menu inside the plugin, detached from hubs plugin
- Nudge delivery: inject only (no toast, no off)
- Fill %: per-message usage ÷ context window; cache reads/writes excluded; never cumulative session totals
- Tool-call CRITICAL requires fill ≥ 35%
- Feature flags: all default `true`, env-overridable
- Request efficiency > token efficiency (fewer larger requests preferred unless genuinely distinct concerns)
- Mechanical alternatives to inference: shell/TS locally; repeated tasks promoted to durable project-scoped TS tooling under `.opencode/tools/`; never Python one-off scripts
- No inference calls for any metric, checkpoint, score, or nudge decision
- All values derive from OpenCode DB (read-only)

## Feature inventory

### Core engine (flags)
1. precisePrompts — truncate prompt text to 1000 chars in caches
2. antiDuplication — loop detection via Jaccard on recent prompts
3. singleConcern — regime-change nudge at health < 70 && fill ≥ 0.5 && absolute ≥ 300K
4. quickRouting — tool execute hook event capture
5. preComputation — session.idle quality refresh + auto-compaction trigger
6. cutExploreAgent — skip agent dispatch measurement in deriveSignals

### Compaction
7. checkpoint-before-compact — capture session state to store
8. restore-after-compact — inject context intel digest + checkpoint block
9. post-compaction reset — clear quality cache after compaction ends

### Continuity
10. cross-session hints — score checkpoints against prompt, surface best
11. cold-resume-lean — token-free reconstruction from SQLite checkpoint
12. checkpoint scoring — keyword overlap between prompt and checkpoint content

### Active compression
13. Delta Mode — re-reads return only what changed
14. Structure Map — unchanged file re-reads return structural skeleton
15. Bash Compression — CLI output condensed (~10%)
16. Search Compression — grep/web results condensed to top hits + counts (~15%)
17. Lean-Output Nudges — steer model to concise output when context fills
18. Quality Nudges — warn when context quality drops
19. Loop Detection — catch retry loops before they burn tokens
20. Activity Mode — classify session from last 10 tool calls
21. Decision Extraction — capture decision statements, inject as CRITICAL DECISIONS at compaction

### Quality scoring
22. 7-signal quality score — fill, stale reads, bloat, density, agent efficiency, waste, compactions
23. Letter grades S–F
24. Fill percentage — per-message usage ÷ window
25. CRITICAL/WARNING thresholds — fill ≥ 85% / ≥ 75%; tool-call CRITICAL requires fill ≥ 35%

### Session DB & savings
26. Local SQLite store — quality cache, savings ledger, checkpoints
27. Savings tracking — compression + checkpoint_restore events
28. Read-only OpenCode DB adapter — session_v2, session, message, part tables

### Tooling & CLI (hub-like menu, single access point)
29. status — live health, fill %, tool count, quality grade
30. compact — checkpoint then compact
31. resume — reopen cold session from checkpoint
32. compress — mechanical alternative for large tool output
33. route — model + effort recommendation before spending
34. savings — dollar + token savings report
35. audit — full context audit with guided fixes
36. config — feature flags + nudge delivery display

### Context & nudges
37. Context Intel Digest — post-compaction re-orientation
38. Model Routing Nudges — steer to right model tier
39. Inject-only nudge delivery
40. Live quality bar — sidebar TUI, prepend slot

### Explicitly excluded
- Dashboard (HTML generator, browser launch)
- Search-result limiting / websearch routing
- MCP introspection, Memory Health, Attention Optimizer
- JSONL trim/dedup
- Platform adapters (Claude Code, Codex, etc.)
- Install/uninstall, npm packaging, marketplace

## Request efficiency (insight 1)
- recordRequest() tracks input/output tokens per request
- requestEfficiency() = tokensPerRequest normalized; fewer larger = higher
- shouldPreferLargerRequest() advises consolidation when 5+ requests < 20k tokens each

### Mechanical alternatives (insight 2)
- compressShellOutput() — local compression >4KB output
- promoteToProjectTooling() — writes to `<project>/.opencode/tools/<slug>.ts`
- slugify() — filesystem-safe task naming
- No Python one-off scripts ever
- TypeScript preferred for promoted tooling

## Gap audit — what I built vs what I forgot

| # | Feature | Built? | Gap |
|---|---------|--------|-----|
| 1 | precisePrompts | Yes | Truncates in caches; lean nudge only when fill ≥ 25% |
| 2 | antiDuplication | Yes | detectLoop in prompt + context hooks |
| 3 | singleConcern | Yes | surface() in context hook |
| 4 | quickRouting | Yes | Gates tool execute hooks |
| 5 | preComputation | Yes | session.idle quality refresh + auto-compact |
| 6 | cutExploreAgent | Yes | Passed to deriveSignals |
| 7 | checkpoint-before-compact | Yes | service.checkpoint() |
| 8 | restore-after-compact | Yes | compaction hook injects digest + block |
| 9 | post-compaction reset | Yes | session.compaction.ended clears cache |
| 10 | cross-session hints | Yes | restoreFor() scores checkpoints |
| 11 | cold-resume-lean | Yes | buildResumeBlock from checkpoint |
| 12 | checkpoint scoring | Yes | scoreCheckpoint keyword overlap |
| 13 | Delta Mode | Yes | fileReadDelta + fileStructureMap in service.ts; wired in tool.execute.after |
| 14 | Structure Map | Yes | fileStructureMap in service.ts; wired in tool.execute.after |
| 15 | Bash Compression | Yes | compressShellOutput in tool.execute.after |
| 16 | Search Compression | Yes | websearch/webfetch/searxng_web_search compression in tool.execute.after |
| 17 | Lean-Output Nudges | Yes | verbosityNudge |
| 18 | Quality Nudges | Yes | qualityNudge |
| 19 | Loop Detection | Yes | detectLoop |
| 20 | Activity Mode | Yes | classifyMode |
| 21 | Decision Extraction | Yes | DECISION_RE + extractDecisions + sessionDecisions map; injected at compaction |
| 22 | 7-signal quality score | Yes | computeQuality |
| 23 | Letter grades S–F | Yes | grade() |
| 24 | Fill percentage | Yes | fillFraction per-message ÷ window |
| 25 | CRITICAL/WARNING thresholds | Yes | fillWarning + toolCallWarning |
| 26 | Local SQLite store | Yes | OptimizerStore |
| 27 | Savings tracking | Yes | logSavings |
| 28 | Read-only OpenCode DB adapter | Yes | db/opencode.ts |
| 29 | status | Yes | menu + rio_status tool |
| 30 | compact | Yes | menu + client.session.compact |
| 31 | resume | Yes | menu + restoreFor |
| 32 | compress | Yes | menu |
| 33 | route | Yes | menu |
| 34 | savings | Yes | menu + store.savings |
| 35 | audit | Yes | menu |
| 36 | config | Yes | menu + config() |
| 37 | Context Intel Digest | Yes | buildIntelDigest |
| 38 | Model Routing Nudges | Yes | active surface() in context hook based on requestEfficiency |
| 39 | Inject-only delivery | Yes | surface() uses event.system.push; toast() removed |
| 40 | Live quality bar | Yes | tui.tsx prepend slot |

### Implemented beyond plan

| Item | Where |
|------|-------|
| recordRequest() hooked to tool.execute.after | index.ts tool hook — Insight 1 active |
| /rio slash command registered | index.ts ctx.command.transform |
| Menu actions wired to real service methods | src/menu.ts runMenuAction() |
| Dead toast() removed | index.ts |
| Dead request-efficiency.ts removed | File deleted |
| Example promoted project-scoped TS tool | Not needed — promoteToProjectTooling() is the mechanism; used via restoreFor on session start |

## Remaining work (ordered)

1. Test suite (bun) for fillFraction, quality scoring, compaction trigger, menu output
2. Verify in interactive OpenCode TUI session (sidebar bar + /rio command)
3. Optionally: add more promoted project-scoped TS tools for repeated mechanical tasks
