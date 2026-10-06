# Learnings

Corrections, knowledge gaps, best practices, and stale knowledge found in this project's
`.opencode/` config. Dedupe by **Pattern-Key**; increment Recurrence-Count.

---

## LRN-20261003-000001 — `hive` → `hive-methodology` routing is fixed; stale "next" item
- **Type**: correction
- **Pattern-Key**: `project-memory-stale-next-items`
- **Recurrence-Count**: 1
- **Status**: fixed
- **Priority**: low
- **Source**: conversation
- **Area**: `.opencode/state/project-memory.json`
- **Logged**: 2026-10-03
- **Why it will matter later**: `project-memory.json` `next[]` is the resume path for the next
  session. A resolved item sitting in `next[]` costs a re-investigation every session until it is
  cleared — and worse, it trains you to distrust the list. Stale entries must be cleared, not left
  as a to-do shadow.
- **Summary**: `project-memory.json` carried
  `"Verify orchestrate hive → hive-methodology skill routing — spec references hive-methodology but dir is skills/hive/"`.
  Verified resolved: `skills/hive-methodology/SKILL.md` exists, and `validate-delegation` reports
  `swarm-hub hive` → `hive-methodology` as `ok` at
  `/home/tlh/.config/opencode/skills/hive-methodology/SKILL.md`. The concern was correct when
  written and has since been fixed.
- **Reproduce clues**: none — already resolved. Confirmed by direct path check + validator run.
- **Fix applied**: removed from `next[]`. The second item ("Consider automated TUI dist rebuild")
  was *not* stale — it is the open half of FEAT-20261003-000001 and has since been implemented as the
  `hub-menu-rebuild-after-write` hook; it is annotated accordingly rather than deleted.
- **Original fix direction**: remove the item from `next[]`. The second item ("Consider automated TUI dist
  rebuild") is *not* stale — it is the open half of FEAT-20261003-000001; keep it and link it.
- **See Also**: FEAT-20261003-000001

---

## LRN-20261003-000002 — Telemetry records no error events; it cannot supply failure signals
- **Type**: knowledge_gap
- **Pattern-Key**: `telemetry-no-error-events`
- **Recurrence-Count**: 1
- **Status**: open
- **Priority**: medium
- **Source**: conversation
- **Area**: `.opencode/state/telemetry.ndjson`, SRCL hook
- **Logged**: 2026-10-03
- **Why it will matter later**: the `self-improvement` skill's Metrics section defines five
  always-on signals (first-attempt success, avg revisions, error recurrence, correction rate,
  time-to-completion accuracy). None of them can be computed from the current telemetry, so the
  loop has been running on anecdote. Fixing the capture is a prerequisite for the whole loop being
  evidence-driven rather than guess-driven.
- **Summary**: 954 telemetry rows contain only 5 event kinds — `file.read` (670), `shell.read` (264),
  `hub.invoc` (10), `skill.loaded` (8), `cache.invalidate-tool` (2). Zero rows carry `ok: false`.
  There is no error event kind, no tool-failure kind, no revision-count kind, and no
  user-correction kind. Errors, retries, and rejections are structurally unrecordable.
- **Reproduce clues**: parse `telemetry.ndjson` and group by `kind`; only the 5 kinds above appear,
  and a count of `ok == false` returns 0 across all 954 rows.
- **Fix direction**: extend the SRCL hook to emit `tool.error` (tool name + error text),
  `assistant.revise` (turn index of each revision of the same task), and `user.correct`
  (turn following a user rejection). Until then, treat every capture in this directory as
  hypothesis-driven rather than metric-driven, and label it so.
- **See Also**: FEAT-20261003-000001
---

## LRN-20261003-000003 — Ollama survived as stale documentation on five surfaces
- **Type**: correction
- **Pattern-Key**: `ollama-docs-stale-after-onnx-migration`
- **Recurrence-Count**: 1
- **Status**: fixed
- **Priority**: medium
- **Source**: conversation
- **Area**: `skills/vectorize-context/SKILL.md`, `rules/efficiency-first.md`, `tools/hubs/maintain-hub/vectorize.ts`, `tools/hubs/spec-registry.json`, `tools/semantic-cache.ts`
- **Logged**: 2026-10-03
- **Why it will matter later**: the ONNX migration landed as code and left the prose behind. A
  reader following `SKILL.md` would try to start a daemon that is no longer on the hot path, or
  size a vector table at 1024 dims against a 384-dim store. Documentation that contradicts the
  code is worse than absent documentation, because it is trusted.
- **Summary**: after the embedder moved, five surfaces still described Ollama embeddings at
  1024 dims: the skill's frontmatter and model table, its indexing step, `efficiency-first.md`'s
  retrieval-ladder note, the `/maintain-hub vectorize` spec, and the generated
  `spec-registry.json`. The spec registry is generated, so fixing the spec without rebuilding left
  the stale text in the artifact the agent actually reads.
- **Fix applied**: all five updated; spec registry regenerated via `npx tsx tools/build-spec-registry.ts`.
  `mxbai` now appears nowhere in `tools/`, `rules/`, or the skill.
- **See Also**: ERR-20261003-000005

---

## LRN-20261003-000004 — A test that reimplements the code it tests proves nothing
- **Type**: best_practice
- **Pattern-Key**: `test-mirrors-implementation-instead-of-calling-it`
- **Recurrence-Count**: 1
- **Status**: promoted
- **Priority**: high
- **Source**: error
- **Area**: `tests/global/delegation.test.ts`
- **Logged**: 2026-10-03
- **Why it will matter later**: the suite was green through a shipped bug *because* it contained
  a correct private copy of the logic. Coverage read as 100% of a function nobody was calling. The
  failure is invisible from the test report — the only tell is that the copy and the original can
  drift, which is precisely what happened.
- **Summary**: `checkDelegation` in `delegation.test.ts` reimplemented `validateTarget`'s path
  construction, stripping `@` correctly with a comment explaining why. The shipped tool did not
  strip `@`. Result: 21 false failures in production, 226 green tests locally.
- **Fix applied**: the copy is deleted. `validateTarget` is exported from the tool and imported by
  the test, so the two cannot drift. The general rule, recorded here because it generalizes past
  this one file: **if a test could pass while the product is broken, it is testing a copy**.
  Import the thing; if it cannot be imported, that is the bug.
- **See Also**: ERR-20261003-000001, ERR-20261003-000002
