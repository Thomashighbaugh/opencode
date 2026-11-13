# ONNX Runtime — local inference

Every local model in this harness — the embedder, the reranker, the prompt-queue's classifier, and
the decision engine — runs on ONNX Runtime via `@huggingface/transformers`, in-process,
int8-quantized.

| Model                                | Role                                | Dim / size          |
| ------------------------------------ | ----------------------------------- | ------------------- |
| `Xenova/bge-small-en-v1.5`           | Embedder (was Ollama `mxbai`)       | 384, ~58 MB         |
| `Xenova/bge-reranker-base`           | Cross-encoder reranker              | single logit, ~279 MB |
| `Xenova/mobilebert-uncased-mnli`     | Zero-shot classifier — gate, `ask`  | 3-way, ~27 MB       |
| `Xenova/nli-deberta-v3-xsmall`       | Stronger head — `failure`, `asksChoice` | 3-way, ~92 MB (optional) |

```bash
npx tsx skills/vectorize-context/scripts/prefetch-models.ts          # fetch
npx tsx skills/vectorize-context/scripts/prefetch-models.ts --check   # report only
```

---

## Why the embedder moved off Ollama

Retrieval previously required a running daemon, and its failure mode was the reason for the
change: **an unreachable Ollama produced zero vectors, which is indistinguishable from "no
results"**. A dead daemon looked like an empty index. Three things are now true:

- **No daemon.** Retrieval does not depend on another process being up.
- **No network** after the first fetch.
- **Diagnosable.** `__hubsDiagnostics().embedder` reports backend, model, dim, and whether the
  weights are on disk, so "nothing matched" and "the embedder is not loaded" are different
  answers.

`EMBED_BACKEND=ollama` remains as an explicit escape hatch for comparing recall between the two
embedders on the same corpus. It is **not** a fallback — the previous arrangement had no fallback,
which is precisely what made the failure invisible.

### Dimension change is a migration, not a corruption

1024 → 384 makes every existing vector incomparable. `veclib` versions the store on
`embedding_model` + `embedding_dim` and drops the vec tables when either changes, so the swap is a
re-embed (415 code files + 86 context files, ~200 s) rather than a mismatch at insert time.

Measured on this repo:

```
code.db:    embedding_model=onnx:Xenova/bge-small-en-v1.5:q8  embedding_dim=384
context.db: embedding_model=onnx:Xenova/bge-small-en-v1.5:q8  embedding_dim=384
```

---

## The two loading conventions, and why they differ

`onnx-runtime.ts` holds one place for: cache under the config tree (not `~/.cache`), load once
per process, and `dtype: 'q8'`.

Then there are **two** rules, because the two models sit on opposite sides of a cost boundary:

| Model           | Role         | May download on first use? | Why |
| --------------- | ------------ | -------------------------- | --- |
| Embedder        | index-time   | **Yes**                    | Runs in batches once per changed file; an index that cannot run is worse than one that fetched 33 MB |
| Reranker        | query-time   | **No**                     | The user is waiting; a model fetch inside a keystroke's latency is indistinguishable from a hang |
| Classifier      | query-time   | **No**                     | Same |
| Decision engine | query-time   | **No**                     | Same — an uncached model means "no verdict", not a stalled turn |

A missing query-time model degrades to a documented fallback — distance ordering without a
reranker, the regex gate without the classifier.

---

## Pooling: the bug that changes nothing visible

| Pooling   | Used by             | Rule                          |
| --------- | ------------------- | ----------------------------- |
| `clsPool` | **bge** models      | take `[CLS]`, then L2-normalize |
| `meanPool`| MiniLM-style models | mean over the **attention mask**, then L2-normalize |

Mean-pooling a bge model returns correctly-shaped, correctly-normalised vectors that retrieve
plausibly and **rank badly**. Nothing throws, the dimension is still 384, and the store reports
healthy. It is the hardest retrieval bug to notice, which is why both poolers have direct tests and
why the pooling function is named at the call site rather than hidden behind a default.

Mean-pooling over the padded tail instead of the mask has the same character of failure: every
vector in a batch drifts toward the pad embedding.

---

## The classifier

`plugins/prompt-queue/classifier.ts` decides whether an assistant turn ended by asking the user
something. It is **advisory and can only tighten the gate**:

| Regex verdict | Model  | Result |
| ------------- | ------ | ------ |
| holds         | any    | holds — the model never releases a question |
| releases      | holds  | **holds** — this is the value: catching the ask the phrase list misses |
| releases      | silent | releases — the regex gate stands alone |

A model that is confidently wrong in the permissive direction would bury a question the user is
waiting on. One that is wrong in the strict direction costs a turn of latency.

### Measured, not assumed

The threshold is not "tuned until green". Ten hand-labelled turns, three hypothesis framings:

| Framing                                                        | Weakest real ask | Strongest false-positive-looking completion |
| -------------------------------------------------------------- | ---------------- | ------------------------------------------ |
| A — "The author is asking the reader a question…"                | 3.30             | **3.24** — no usable margin                 |
| **B — "This example is a request for the reader to answer…"**   | **3.45**         | **−0.25**                                   |

Framing A scored a *problem report* ("There are two problems: the parser and the schema") barely
above a genuine completion. Framing B put it clearly on the report side.

### Two bugs this surfaced, both producing confident nonsense

1. **Label order.** This checkpoint orders labels `ENTAILMENT, NEUTRAL, CONTRADICTION` — the
   reverse of the MNLI convention. Reading the conventional index scores *neutral* as entailment,
   which returned **> 0.93 for every input**. The label index is now read from the model's own
   `id2label`.
2. **`text_pair` length.** Scoring two hypotheses against one premise is invalid —
   `text` and `text_pair` must be the same length. The first version passed both hypotheses as
   pairs and then read only row 0, i.e. scored one hypothesis against nothing.

### Known limitation, measured

Subtle asks land in a lukewarm band and are **not** caught:

| Turn                                                   | p      | Gate  |
| ------------------------------------------------------ | ------ | ----- |
| `I need a decision from you before I continue.`        | 0.969  | held  |
| `I am ready to proceed. Choose between A and B.`      | 0.744  | not held |
| `Two options remain: migrate in place, or dual-write…` | 0.646  | not held |
| `I am ready to proceed. Pick one: A or B.`            | 0.574  | not held |

The threshold stays at 0.817 because precision matters more than recall here: the classifier may
only add holds, so catching these would mean lowering it to ~0.55, which would also hold statements
that merely enumerate. A stuck queue costs more than one missed queued prompt.

---

## The decision engine

`skills/vectorize-context/scripts/decisions.ts` is the generic form of the classifier above: a
declared decision is one **affirmative question**, one **affirmative, mutually exclusive contrast**,
and a threshold **measured per model**. `decide(spec, text)` answers with the cheapest signal that
can answer and reports which one it was (`source`: `veto` · `cue` · `model` · `default` · `empty`).

Order is deliberate, each step cheaper than the next:

| Step | Answers | Cost |
| ---- | ------- | ---- |
| veto | an option, a hypothetical, a question | free |
| cue | a commitment marker | free |
| model | the cases the cues cannot see | one forward pass |
| default | nothing is cached | free |

Vetoes run **before** cues: "Should we stick with Postgres?" contains "stick with" and is not a
decision.

### Thresholds are per model, never portable

`calibrated` maps a model id to the threshold measured **on that model**. A model absent from the
map is never consulted, and the decision returns `defaultWhenUnavailable`. This is not ceremony:
`mobilebert-uncased-mnli` and `nli-deberta-v3-xsmall` order and scale the same hypothesis pair
differently, so a threshold carried across heads is a fabricated verdict wearing a measured one's
clothes. `resolveModel` therefore returns `null` rather than a substitute.

### Both hypotheses must be affirmative and mutually exclusive

A hypothesis phrased as the negation of the other — "This text does **not** contain a security
risk" — reads as thematic overlap in NLI, not as the complement, and collapses the margin:

| Framing | Measured AUC | Verdict |
| ------- | ------------ | ------- |
| negated contrast ("does not …") | 0.500 | useless |
| affirmative but overlapping ("tells the reader what to do") | no usable margin | rejected |

The contrast choice is load-bearing. For `asksChoice`, the obvious "This text tells the reader what
to do" does **not** separate (positives 0.68..2.48 against negatives 1.90..2.22) because a
preference statement also tells the reader what to do. "…reports a choice that was already made" is
mutually exclusive with asking, and it separates at positives 4.50..5.95 against negatives
2.66..−1.58.

### What ships, with the measurement behind it

`Xenova/nli-deberta-v3-xsmall`, six examples per class, using the exact registered pairs:

| Decision | Δ positives | Δ negatives | Threshold | AUC |
| -------- | ----------- | ----------- | --------- | --- |
| `failure` — "reports a failure or an error" vs "everything worked as expected" | 5.78..1.33 | 0.64..−2.81 | 0.728 | 1.000 |
| `asksChoice` — "asks the reader to make a choice" vs "reports a choice already made" | 4.50..5.95 | 2.66..−1.58 | 0.973 | 1.000 |
| `ask` — the gate's pair, on `mobilebert` | 2.30..5.51 | 0.19..−0.35 | 0.817 | 1.000 |

Two decisions were measured and **rejected**, both recorded in the module header:

- **`security` — "contains a security risk"** (AUC 0.722, classes interleaved). Factual properties
  are not what NLI entailed; a natural-language secret scored *below* an ordinary ADR.
- **`durableDecision` — "committed" vs "reported" stance.** On a small balanced set this looked
  separable at AUC 0.972. On 30/30 realistic assistant sentences it measured **AUC 0.37–0.75 across
  five framings**, and an embedding-prototype attempt scored at chance (max-cosine gap −0.01).
  Stance is not an entailment relation, so rio's decision *extractor* stays cue-based and uses the
  model only for the one thing it measures well — "is this sentence a question?".

`plugins/rio/src/decisions.ts` is that extractor: veto → cue → `ask` (only for sentences with
second-person address, because the gate's threshold over-reads bare declaratives at ~0.91) →
default. Cue-only, it measures **96.7 % recall / 100 % precision** on the 30/30 corpus in
`tests/global/fixtures/decision-corpus.ts`.

---

## Cold start, and a regression worth naming

The query child is a persistent server that now warms **both** models before signalling
`{ready: true}`. Readiness means "loaded and serving", which is what it should mean.

That exposed a coupling: readiness and inference shared one 12-second clock, so a cold child spent
the query's whole timeout installing itself. With two models the first query went from ~2s to
**11s against a 12s budget** — passing alone, failing under the full suite's parallel load.

Two fixes:

- The child spawns on `session.created`, so loading overlaps the user reading rather than their
  first question.
- The budgets are separated: a 30s readiness budget (backgrounded), then a 12s first-query budget
  that covers inference only.

---

## Tests

`tests/global/onnx.test.ts` — 45 tests. Model-backed tests are `skipIf` the weights are not
cached, so `bun run test:run` never downloads 60 MB to run the suite.

Covered: pooling correctness against hand-built tensors · cache location · per-model download
policy · failed loads not poisoning later callers · dimension agreement with the vec0 table · unit
vectors and determinism · classifier contract (can only tighten) · the measured separation band ·
gate integration with stub and live classifiers · the classifier never being consulted for an
already-held turn · the anti-deadlock guard applying to model holds · and the wiring, including
that `hooks.ts` reports the embedder without importing the vector library.

`tests/global/decisions.test.ts` — 24 tests. Three layers, only the last needing weights:

- **degrade contract** — empty input is `null`/`empty`; no cue and no model returns the *declared*
  default; a spec whose calibrated model is not cached is never consulted.
- **precedence and extraction** — a veto beats a cue ("Should we stick with Postgres?"); the
  30/30 corpus is held at ≥0.9 recall and **zero** false positives; a realistic eight-sentence turn
  yields exactly its three decisions; sentence segmentation survives `tui.tsx`, `0.82` and
  `.opencode/state`.
- **calibration** — every threshold names a model the runtime declares (a typo would otherwise mean
  a decision that silently always defaults), and each decision's calibration set must separate on
  the cached head. The `ask` false positive on a bare preference statement is asserted *as* a false
  positive, so tightening it has to confront the gate it is shared with.

→ [Knowledge Plane](knowledge-plane.md) · [Prompt Queue](prompt-queue.md)
