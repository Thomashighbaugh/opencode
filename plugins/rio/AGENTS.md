<!-- Parent: ../AGENTS.md -->

# rio

One plugin, one command. `rio` combines token optimization (context fill, quality scoring,
request efficiency, mechanical alternatives) with a local memory system, and exposes a small set
of agent tools. It is deliberately self-contained: it shares `.opencode/state/vector/memory.db`
with `memory-hub` so the two are always compatible, but it imports nothing from `hubs`.

| Path | Role |
| --- | --- |
| `index.ts` | V2 server entry — tools, event hooks, compaction and turn-analytics wiring |
| `tui.tsx` | TUI half — the `/rio` menu |
| `src/decisions.ts` | **Decision extractor** — cue/veto/`ask` pipeline over turn output |
| `src/menu.ts` | Menu item table and dispatch (`buildMenuItems`, `runMenuAction`) |
| `src/service.ts`, `src/config.ts` | Feature flags and service wiring |
| `src/analyze.ts`, `src/quality.ts`, `src/intel.ts`, `src/nudges.ts` | Fill %, quality grade, digests, nudges |
| `src/compress.ts`, `src/mechanical.ts` | Local output compression and tool-promotion helpers |
| `src/memory.ts`, `src/db/` | Memory service and SQLite stores (memory + opencode telemetry) |
| `src/checkpoint.ts`, `src/continuity.ts`, `src/compaction.ts` | Checkpoint / resume / compaction mode |
| `src/pricing/`, `src/rerank.ts`, `src/text.ts`, `src/privacy.ts` | Cost table, reranking, text utils, redaction |
| `test/` | Bun tests (`bun test plugins/rio`) |

## Tools

| Tool | Purpose |
| --- | --- |
| `rio_status` | Live context health, fill %, tool count, quality grade |
| `rio_menu` | Open the hub-like menu |
| `rio_decide` | Answer a yes/no question about text with a **local ONNX model** — no inference request |
| `rio` | Menu dispatch by subcommand id |
| `memory_learn` / `memory_recall` / `memory_get` / `memory_forget` | Local memory CRUD and hybrid recall |

`rio_decide` is the "don't escalate to a bigger model for a mechanical yes/no" surface. It takes
either a registered `decision` id or an ad-hoc `question` + `contrast` pair:

```
rio_decide { decision: "asksChoice", text: "Pick one: rewrite or revert." }
rio_decide { question: "This text reports a failure.", contrast: "This text reports success.", text: "..." }
rio_decide { stats: true }
```

## The decisions model

`src/decisions.ts` replaced a single `DECISION_RE` word list that was wrong in both directions on
real output: it accepted "I resolved the merge conflict" (work) and "confirm the build passes"
(an instruction), and it missed "Going with q8", "From now on…", "Final call: …" and "Use bun,
not npm". A missed decision is dropped at compaction and is never recoverable, so the cue set is
written for precision first and then widened deliberately.

Pipeline per sentence, each step cheaper than the next:

| Step | Signal |
| --- | --- |
| 1 | **Veto** — an option, a hypothetical, a question (`?`, could/would/might, `if we`, `let me know`, …) |
| 2 | **Cue** — a commitment marker (`Decision:`, `we agreed`, `going with`, `from now on`, `final call`, `let's <verb>`, …) |
| 3 | **`ask`** — only for cued sentences that contain second-person address |
| 4 | **default** — nothing cached means no verdict |

Vetoes run first because "Should we stick with Postgres?" contains "stick with". The `ask` call is
gated on `/\b(?:you|your)\b/i` because the classifier's threshold was calibrated on turn *tails*,
where an ask is expected, and it over-reads a bare declarative as an ask (measured 0.91 on
"This module scores a premise against a hypothesis").

Measured cue-only on the 30/30 corpus in `tests/global/fixtures/decision-corpus.ts`:
**96.7 % recall, 100 % precision**, one documented miss ("Right, so: rio owns memory, …").

### Why the model is not the primary signal

Zero-shot NLI cannot separate *committed* from *reported* stance: across five framings on 30/30
realistic sentences it measured AUC 0.37–0.75, and an embedding-prototype attempt scored at
chance. The 0.972 seen earlier was an artefact of a small balanced set. So the extractor keeps the
commitment signal in cues — auditable, free, and correctable without retraining — and uses the
model only where it measurably works. See
`skills/vectorize-context/scripts/decisions.ts` for the registered decisions, their thresholds,
and the rejected ones.

## Feature flags

All default `true`, env-overridable:

`RIO_PRECISE_PROMPTS`, `RIO_ANTI_DUPLICATION`, `RIO_SINGLE_CONCERN`, `RIO_QUICK_ROUTING`,
`RIO_PRE_COMPUTATION`, `RIO_CUT_EXPLORE_AGENT`, `RIO_PREFER_FEWER_LARGER_REQUESTS`,
`RIO_MECHANICAL_ALTERNATIVES`, `RIO_PROMOTE_TO_PROJECT_TOOLING`,
`RIO_PREFER_TYPESCRIPT_OVER_PYTHON`, `RIO_MEMORY`, `RIO_KEEP_WARM`.

`RIO_DATA_DIR` overrides the data directory (default `~/.local/share/opencode/rio`).

## Testing

- `bun test plugins/rio` — plugin-local behaviour.
- `npx vitest run tests/global/decisions.test.ts` — the engine and extractor contracts.
- Nudges deliver by injection only (no toast, no off switch).
- `ctx` is typed `any` throughout; the todo/hubs TUI plugins infer from `Plugin.Definition`
  instead of casting.

<!-- MANUAL: -->
