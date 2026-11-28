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
  `orchestrate-hub hive` → `hive-methodology` as `ok` at
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
- **Area**: `skills/vectorize-context/SKILL.md`, `rules/efficiency-first.md`, `tools/hubs/verify-hub/vectorize.ts`, `tools/hubs/spec-registry.json`, `tools/semantic-cache.ts`
- **Logged**: 2026-10-03
- **Why it will matter later**: the ONNX migration landed as code and left the prose behind. A
  reader following `SKILL.md` would try to start a daemon that is no longer on the hot path, or
  size a vector table at 1024 dims against a 384-dim store. Documentation that contradicts the
  code is worse than absent documentation, because it is trusted.
- **Summary**: after the embedder moved, five surfaces still described Ollama embeddings at
  1024 dims: the skill's frontmatter and model table, its indexing step, `efficiency-first.md`'s
  retrieval-ladder note, the `/verify-hub vectorize` spec, and the generated
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

---

## LRN-20261126-000001 - expose hidden subagents to the dispatcher, do not un-hide them
- **Type**: correction
- **Pattern-Key**: `dispatcher-omits-hidden-subagents`
- **Recurrence-Count**: 1
- **Status**: fixed
- **Priority**: high
- **Source**: user_feedback
- **Area**: plugins/hubs/index.ts, agents/, runtime subagent dispatcher
- **Logged**: 2026-11-26
- **Why it will matter later**: when the model cannot see the specialists, every delegation falls back to `general` with a hand-written brief, which costs extra requests and tokens. The failure is silent: the specialists stay invocable by name, so nothing errors.
- **Summary**: I un-hid all 30 subagents to make them dispatchable; the user corrected that hidden is intentional to keep the @ menu clean and that the dispatcher should include them without crowding the user. Verified root cause: `opencode2 debug agents` showed the only non-hidden subagents are `general` and `web-search`, exactly the two the dispatcher description lists. The specialists were invocable by name but unlisted. Fix: keep `hidden: true`, append the roster to the dispatch tool description where reachable, register a `listSubagents` fallback, and state in AGENTS.md that hidden specialists are dispatchable by name.
- **Reproduce clues**: `opencode2 debug agents` -> non-hidden subagents = {general, web-search}; the `subagent` tool description lists only those two, yet `subagent({ agent: "convention-extractor" })` runs.
- **Fix direction**: modify the exposure layer (tool description or a roster tool), never the user-facing visibility.

---

## LRN-20261126-000002 - compression is ambient, not a subcommand
- **Type**: correction
- **Pattern-Key**: `compression-as-command-vs-ambient`
- **Recurrence-Count**: 1
- **Status**: fixed
- **Priority**: medium
- **Source**: user_feedback
- **Area**: rules/output-compression.md, plugins/rio/index.ts, plugins/rio/src/inject.ts
- **Logged**: 2026-11-26
- **Why it will matter later**: a compress command is the one optimization the user must remember to run; compression as a default hook saves tokens on every large tool result without a prompt, and the artifact pool means nothing is lost.
- **Summary**: output compression was exposed as a menu subcommand. The user required it be the de facto output convention applied always (applied at user direction, not a recurrence promotion). Implemented: a rule section stating tool-output compression is standing behavior; a hook that compresses every tool result over 8192 chars; storage of the full output in a decaying `artifact` memory category; a token-interval sweep (accumulated output tokens, fill backstop; tool-call count is not a trigger because mechanical calls mean fewer tokens).
- **Reproduce clues**: previously the compress action only ran on `/rio compress`; a large non-bash tool result was never compressed and never stored.
- **Fix direction**: compress by default, store the full artifact, sweep at token intervals.
- **Promoted into**: rules/output-compression.md "Tool-output compression is always on"; plugins/rio hooks.

---

## LRN-20261126-000003 - prefix resume labels to disambiguate
- **Type**: best_practice
- **Pattern-Key**: `ambiguous-resume-label`
- **Recurrence-Count**: 1
- **Status**: fixed
- **Priority**: low
- **Source**: user_feedback
- **Area**: plugins/hubs/data/hubs/*/resume*.ts
- **Logged**: 2026-11-26
- **Why it will matter later**: three different menus resume different things; a bare `resume` makes the user guess which state is restored.
- **Summary**: thinking already had a resume, so rio's `resume` and `resume-lean` collided conceptually. Renamed to `resume-memory`, `resume-memory-lean`, `resume-thinking`, `resume-orchestration`, and added normalizeRoute aliases so old labels still resolve (applied at user direction).
- **Reproduce clues**: `hubNames()` listed multiple menus whose subcommands included `resume` or a variant.
- **Fix direction**: prefix every resume label with what it resumes.
- **Promoted into**: hub spec labels and normalizeRoute aliases.

---

## LRN-20261126-000004 - rio command names must share one prefix per domain
- **Type**: best_practice
- **Pattern-Key**: `rio-command-prefix-collisions`
- **Recurrence-Count**: 1
- **Status**: fixed
- **Priority**: low
- **Source**: user_feedback
- **Area**: plugins/hubs/data/hubs/runtime-hub/, plugins/hubs/data/hubs/knowledge-hub/
- **Logged**: 2026-11-26
- **Why it will matter later**: rio's `status`, `audit`, `config`, `doctor`, `report`, `coach`, `savings`, and `route` collided with existing hub labels; without prefixes the user cannot tell `audit` (code health) from `audit` (session efficiency) from `audit` (antislop).
- **Summary**: adopted three prefixes: `runtime-*` for status, flags, health; `token-use-*` for audit, report, coach, savings, route; `resume-*` for anything that resumes. Tools renamed to match (`runtime-status`, `runtime-decide`, `runtime` dispatcher).
- **Reproduce clues**: duplicate-label check across menus flagged `status`, `audit`, `config`, `doctor` before the rename.
- **Fix direction**: one prefix per domain; keep the bare word for the canonical command only.
