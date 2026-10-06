# Errors

Failures observed in this project's `.opencode/` config: tool, skill, config, environment.
Entry format per `self-improvement` skill. Dedupe by **Pattern-Key**; increment Recurrence-Count.

---

## ERR-20261003-000001 — validate-delegation reports 21 false-positive "missing" agents
- **Type**: config
- **Pattern-Key**: `validate-delegation-at-prefix`
- **Recurrence-Count**: 1
- **Status**: fixed
- **Priority**: high
- **Source**: error
- **Area**: `tools/validate-delegation.ts`
- **Logged**: 2026-10-03
- **Why it will matter later**: `validate-delegation` is the only automated gate on hub
  delegation integrity. At a 21/183 (11.5%) false-failure rate it trains you to ignore its
  `valid: false` verdict — so the day a route *genuinely* breaks, the gate says nothing.
  A verification tool that cries wolf is worse than no tool.
- **Summary**: `validate-delegation` builds agent paths as
  `path.join('agents', `${target}.md`)` (`tools/validate-delegation.ts:52`) without stripping the
  `@` prefix. 21 of 26 agent-delegating specs follow the `@name` convention (e.g. `agent: "@analyst"`),
  so the tool probes for `agents/@analyst.md` and reports `missing`. All 21 targets exist as
  `agents/<name>.md`. Confirmed by direct filesystem check — 21/21 present.
- **Reproduce clues**: `validate-delegation validate` → `"valid": false, "ok": 162, "missing": 21`.
  Every `missing` entry has an error string containing `agents/@<name>.md`. Any `ok` agent entry
  uses a bare target (`architect`, `deep-thinker`, `code-reviewer`) and resolves correctly —
  bare targets pass, `@`-prefixed targets fail. That asymmetry is the tell.
- **Fix direction**: Strip a leading `@` from `target` before the switch (one line, all three
  branches), then add a `tests/global/` case asserting `agent: "@analyst"` resolves. NOT applied.
- **Why this is not gate-blocked**: the promotion rule (Recurrence-Count >= 3) governs *statistical*
  patterns. This is a proven code defect with a direct filesystem counter-example, so the evidence
  requirement is already satisfied by proof rather than by recurrence. Still requires user approval.
- **Fix applied**: `target.replace(/^@/, '')` in the `agent` branch only. Scoped
  deliberately — `@skill` is not a convention anywhere, and stripping it there
  would resolve a typo into a real skill and hide the mistake.
- **Evidence**: before `ok:162 missing:21`; after, all 183 subcommands resolve and
  `tests/global/delegation.test.ts` is 226/226. The 21 "missing" targets were all
  present on disk the whole time.
- **See Also**: ERR-20261003-000002 (same class of problem — a gate that does not fire)

---

## ERR-20261003-000002 — No test covers `validateTarget` path construction
- **Type**: knowledge_gap
- **Pattern-Key**: `delegation-path-builder-untested`
- **Recurrence-Count**: 1
- **Status**: fixed
- **Priority**: medium
- **Source**: error
- **Area**: `tests/global/delegation.test.ts`
- **Logged**: 2026-10-03
- **Why it will matter later**: ERR-000001 survived because the only test touching this code path
  (`tests/project/resolution.test.ts:79`) exercises a *fixture* resolver, never the real
  `validateTarget`. The suite gives the appearance of coverage over delegation resolution while
  covering none of it. Any future edit to the path builder lands untested.
- **Summary**: the root cause was worse than missing coverage — it was a test that
  *replaced* the code under test. `tests/global/delegation.test.ts` carried its own copy of
  `validateTarget`'s path logic, and that copy stripped `@` correctly, with a comment naming
  this exact bug. So the suite asserted against a correct implementation while the shipped tool
  was broken, and stayed green through it.
- **Reproduce clues**: `rg -ln "validate-delegation|validateDelegation" tests/` → one file, one
  assertion, fixture-scoped.
- **Fix applied**: deleted the copy; `validateTarget` is now exported from the tool and the test
  calls it. Added 9 cases: bare vs `@` resolve identically, no literal `@` in the resolved path,
  *every* `@`-prefixed spec in the live manifest resolves, a genuinely missing target still
  reports `missing` (the `@` fix is not a rubber stamp), and `@skill` stays unresolved.
- **See Also**: ERR-20261003-000001
---

## ERR-20261003-000003 — `base64ToVector` returned the whole Buffer pool, not the slice
- **Type**: config
- **Pattern-Key**: `buffer-pool-slice-missing`
- **Recurrence-Count**: 1
- **Status**: fixed
- **Priority**: critical
- **Source**: error
- **Area**: `tools/semantic-cache.ts`
- **Logged**: 2026-10-03
- **Why it will matter later**: this silently disabled the entire semantic tier of the subagent
  cache. The cosine looked real, the threshold was real, the API returned real numbers — and no
  near-match could ever clear 0.92. A cache that never hits is indistinguishable from a cache
  with nothing worth caching, so this would have been "working as designed" indefinitely.
- **Summary**: `new Float32Array(bytes.buffer)` assumed `Buffer.from(b64, "base64")` owns its
  ArrayBuffer. It does not — Node allocates small Buffers as views into a shared 8 KB pool. A
  4-float vector decoded to a **16384**-float array: real data in the first slots, uninitialized
  pool memory after. Found by the base64 round-trip test, not by inspection.
- **Reproduce clues**: `base64ToVector(vectorToBase64([0.1,-0.25,0.5,0.75])).length === 16384`.
- **Fix applied**: slice from `byteOffset` for `byteLength` bytes, and reject a length that is not
  a whole number of float32s instead of truncating.
- **Evidence**: round-trip now returns length 4 and cosine 1.0; `tests/global/semantic-cache.test.ts`
  is 22/22.
- **See Also**: ERR-20261003-000004

---

## ERR-20261003-000004 — `rerank` was the last Ollama-only tool, and its endpoint 404s locally
- **Type**: config
- **Pattern-Key**: `rerank-tool-ollama-only`
- **Recurrence-Count**: 1
- **Status**: fixed
- **Priority**: high
- **Source**: error
- **Area**: `tools/rerank.ts`
- **Logged**: 2026-10-03
- **Why it will matter later**: everything else in the retrieval stack had already moved to
  in-process ONNX, so with the daemon stopped `graphQuery` worked and `rerank` returned
  ECONNREFUSED. Worse, this machine's Ollama answers `/api/rerank` with **404** — so the tool was
  broken even with the daemon running. A tool that is the only one of its kind and has never been
  exercised is not a tool that works.
- **Summary**: `rerank` POSTed to `${OLLAMA_URL}/api/rerank` with default model
  `hans-tech/bge-reranker-v2-m3:260522`, while `Xenova/bge-reranker-base` sat cached and unused
  next to it. `veclib.embedderStatus().rerankerCached` was already reporting on a model nothing
  loaded.
- **Reproduce clues**: `curl -X POST http://127.0.0.1:11434/api/rerank -d '{...}'` → `404`.
- **Fix applied**: ONNX is the default (`rerankOnnx`, cross-encoder `text_pair`, sigmoid on one
  logit per pair, batched at 16, `allowDownload: false`). Ollama is opt-in via `backend: "ollama"`,
  deliberately *not* a fallback — an automatic fallback would hide a broken ONNX path behind a
  working-but-different scorer. Sigmoid is clamped to ±60 so a strongly-negative logit cannot
  collapse to a hard 0 via `exp` overflow.
- **Evidence**: `tests/global/rerank.test.ts` 25/25, model-backed (not skipped) — relevant document
  outranks an unrelated one despite sharing no content words; indices and `text` survive sorting.
- **See Also**: ERR-20261003-000005

---

## ERR-20261003-000005 — `semantic-cache` embedded via Ollama at a different dimension
- **Type**: config
- **Pattern-Key**: `semantic-cache-ollama-embed`
- **Recurrence-Count**: 1
- **Status**: fixed
- **Priority**: high
- **Source**: error
- **Area**: `tools/semantic-cache.ts`
- **Logged**: 2026-10-03
- **Why it will matter later**: two embedding models in one config means a cosine threshold tuned
  against one is meaningless against the other, and the failure is a cache that quietly stops
  helping. One model for the whole system is the property worth keeping.
- **Summary**: `getEmbedding` POSTed to Ollama `/api/embed` with `pedrohml/mxbai-embed-large`
  (1024-dim) while the vector store and graph used 384-dim ONNX. Beyond the daemon
  dependency, `cosineSimilarity` indexed by the shorter vector and read past its end into
  `undefined`, producing **NaN** — which fails `>= 0.92` for every candidate forever, with no
  error raised.
- **Reproduce clues**: a 384-dim query against a 1024-dim entry yields NaN, not a low score.
- **Fix applied**: uses the shared `embedQuery`; `cosineSimilarity` returns 0 on a length
  mismatch; `INDEX_VERSION` bumped to 2 so a version-1 index is discarded rather than compared;
  `stats` now names `semanticModel` and `semanticDim` so a mismatch is diagnosable.
- **See Also**: ERR-20261003-000003, ERR-20261003-000004

---

## ERR-20261003-000006 — an array-valued `glob` silently disables every hook in the file
- **Type**: knowledge_gap
- **Pattern-Key**: `command-hooks-glob-must-be-string`
- **Recurrence-Count**: 1
- **Status**: fixed
- **Priority**: high
- **Source**: error
- **Area**: `command-hooks.jsonc`, `plugins/command-hooks/types.ts`
- **Logged**: 2026-10-03
- **Why it will matter later**: the failure mode is total and silent. One malformed matcher
  invalidates the file, and *every* hook in it stops firing — typecheck, tests, graph integrity.
  A config that guards your safety checks cannot afford a schema error that only shows up as
  "the checks aren't running".
- **Summary**: added `glob: ["a", "b", "c"]` for the TUI rebuild hook. The type is
  `{ glob: string; regex?: never }` and `schema.ts` requires exactly one of glob/regex, so the
  array failed validation and the loader fell back to a minimal config. Caught by
  `tests/global/command-hooks.test.ts`: 106 pass → 98.
- **Reproduce clues**: `hooksMatched` drops to zero and no error names the bad matcher.
- **Fix applied**: single brace-expanded string —
  `{tools/hubs/**/*.ts,tools/hub-*.ts,skills/*/SKILL.md}` — which picomatch expands. Back to 106.
- **See Also**: FEAT-20261003-000001

---

## ERR-20261003-000007 — "Run queued prompts now" could not fire while idle
- **Type**: config
- **Pattern-Key**: `prompt-queue-idle-only-trigger`
- **Recurrence-Count**: 1
- **Status**: fixed
- **Priority**: critical
- **Source**: user_feedback
- **Area**: `plugins/prompt-queue/index.ts`, `plugins/hubs-tui/src/queue-commands.ts`
- **Logged**: 2026-10-03
- **Why it will matter later**: the queue's entire promise is "this runs later without
  me thinking about it". If the manual override is the thing that silently does
  nothing, then every queue failure looks like a queue bug and no amount of gate
  tuning fixes it. Reported as "the queue never fires prompts".
- **Summary**: the only trigger was `session.idle`, which fires on a *transition*
  into idle. The palette action set `manual: 'release'` and toasted "Releasing on
  the next turn" — but arming a flag while the session is already idle produces no
  new event, so nothing ran until the user happened to send another message. No
  error, no log. A feature whose only escape hatch is the thing that fails has no
  escape hatch.
- **Reproduce clues**: set `manual: 'release'`, stay idle, wait. Nothing fires.
- **Fix applied**: fire requests. `requestFire()` writes a namespaced
  `fire-now.<token>.json`; the plugin handles it on `file.edited` *and* a 1.5s poll
  (the event alone is unreliable for writes from a tool or another process). The
  claim is a rename out of the pending namespace, taken **before** the drain — the
  drain writes `queue.json`, which is itself a `file.edited`, so marking consumed
  afterwards left a window for a double fire.
- **Evidence**: 52 queue-mechanism tests, including one that drains and asserts no
  request remains pending.

---

## ERR-20261003-000008 — Empty-queue early return left the hold counter frozen
- **Type**: config
- **Pattern-Key**: `hold-counter-not-reset-on-empty-queue`
- **Recurrence-Count**: 1
- **Status**: fixed
- **Priority**: medium
- **Source**: error
- **Area**: `plugins/prompt-queue/index.ts`
- **Logged**: 2026-10-03
- **Why it will matter later**: the anti-deadlock budget is meant to stop the gate
  holding forever. If the count survives an empty queue, the budget is spent while
  nothing is queued and the first decision after queueing something can
  deadlock-break and fire immediately — the guard firing at the wrong moment, which
  is worse than not having it.
- **Summary**: the `session.idle` handler returned early when the queue was empty,
  before `recordDecision`, so `consecutiveHolds` kept whatever value it last had.
- **Fix applied**: the empty-queue branch now resets a non-zero counter.
- **See Also**: ERR-20261003-000007

---

## ERR-20261003-000009 — The send-failure restore called `require()` in an ES module
- **Type**: config
- **Pattern-Key**: `esm-require-in-send-failure-path`
- **Recurrence-Count**: 1
- **Status**: fixed
- **Priority**: high
- **Source**: error
- **Area**: `plugins/prompt-queue/index.ts`
- **Logged**: 2026-10-03
- **Why it will matter later**: the branch existed for exactly one reason — do not
  lose queued work when a send fails — and it threw a `ReferenceError` instead of
  restoring anything. The safety net was the hazard. It was also a non-atomic
  write, so the drain it was undoing could be half-read by the other process.
- **Summary**: `require('node:fs').writeFileSync(...)` inside a file that uses
  `import`/`export` throughout. `require` is not defined in ESM.
- **Fix applied**: restores through the shared `save()`, which is atomic.
- **Evidence**: a test strips comments from the source and asserts no `require(`
  remains — comments included, because the fix is *documented* by naming the old
  call, so a naive scan fails on its own explanation.
- **See Also**: ERR-20261003-000010

---

## ERR-20261003-000010 — The queue had no edit, copy, or reorder, and no agent-facing control
- **Type**: knowledge_gap
- **Pattern-Key**: `prompt-queue-no-manual-edit-surface`
- **Recurrence-Count**: 1
- **Status**: fixed
- **Priority**: medium
- **Source**: user_feedback
- **Area**: `plugins/prompt-queue/queue.ts`, `tools/prompt-queue.ts`, `plugins/hubs-tui/src/queue-commands.ts`
- **Logged**: 2026-10-03
- **Why it will matter later**: a to-do list you cannot correct is a to-do list you
  cannot trust. The only affordances were add / run / hold / show / remove / clear
  — so a typo was fixed by removing and retyping, which silently moved the item to
  the end of the queue and changed what runs first.
- **Summary**: no edit, no duplicate, no reorder. And the sole control surface was
  a ctrl+p palette entry in the TUI plugin — a different process from the hooks
  plugin that drains, unreachable headless and invisible to the agent.
- **Fix applied**: `update` (in place, keeps id and position), `duplicate` (adjacent,
  fresh id, records `copiedFrom`), `move` (scoped to its bucket so the deferred
  ordering contract holds). TUI gains Edit / Copy / Reorder, where Copy can also hand
  off to the composer. New `prompt-queue` tool exposes all of it to the agent,
  including `fire` and `fire-one`.
- **Design note**: every one of these refuses to fall back to a bulk action on a bad
  selector — an unmatched id removes nothing, `fire-one` with no match fires nothing,
  and `drainIds([])` drains nothing rather than everything.
