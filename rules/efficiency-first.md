---
name: efficiency-first
description: Universal standing constraint on every interaction — minimize requests to inference hosts and minimize prompt tokens, while spending freely on the work itself. Yields to explicit user instruction. Never constrains output code or requested text.
---

# Efficiency First

**Standing preference, re-applied every interaction cycle.** Not a one-time optimisation pass, not a
rule consulted once at session start. Every time you are about to act, ask: is there a cheaper way to
reach the same end state? Optimize the *cost of asking*, never the *substance of the answer*.

## The Two Budgets

| Budget | Optimizes | Unit | Wins when |
|--------|-----------|------|-----------|
| **Request efficiency** | Number of round-trips to the inference host | calls/turn | N independent calls go in one message; a subagent finishes in 1 turn; a cached or local answer replaces a hosted one |
| **Token efficiency** | Size of the prompt cobbled together and sent | input tokens | Context is retrieved narrowly and reused, never re-inlined; boilerplate is stripped before send; cache is consulted before call |

Both are simultaneously goals. Cutting tokens by adding a request is a loss. Cutting a request by
sending a thinner prompt that omits what the work needs is a worse loss.

## What This Never Constrains

| Free — spend freely | Why |
|---------------------|-----|
| Output code, diffs, generated files | A coding agent throttled on output is a broken coding agent |
| Text the user asked for | Their request, not your budget |
| Test coverage, verification, depth of reasoning | Correctness outranks cheapness |
| Reading a file you have not yet read | Guessing instead of reading costs a whole failed request |

**No length caps. No "make it shorter." No truncating a diff, a test, or an explanation to save
tokens.** This rule governs what you *send to the host*, never what you *produce*.

## Yields to the User

Explicit user instruction always wins — that is the counter-indication this rule is subordinate to.

| Situation | Action |
|-----------|--------|
| "Explain step by step" / "show all the code" | Do it, in full. Compression rules yield. |
| "Don't use subagents, do it inline" | Inline it. Parallelism and delegation are preferences, not mandates. |
| "Skip the cache, just fetch it fresh" | Fetch fresh. |
| "Stop optimizing, just finish" | Finish. |
| No instruction either way | Apply this rule. |

Ambiguous? Optimise the request, never the substance. If the two conflict, substance wins and you say so in one line.

## Decision Order — Request Efficiency

Run top-down; stop at the first hit.

| # | Question | If yes |
|---|----------|--------|
| 1 | Is the answer already in my context from this session? | Use it. Re-read only what you have not read. |
| 2 | Is this deterministic and cacheable (`Glob`, `Grep`, `hubMenu`, `loadSkill`, MCP docs)? | Use the cache tier before calling. |
| 3 | Is this the same task a subagent already performed on unchanged files? | `agent-cache` / `semantic-cache` load, then move on. |
| 4 | Am I about to make N independent tool calls? | Batch all N into **one** message. This is the single largest saving available. |
| 5 | Will this subagent need a follow-up turn to understand its task? | Make the prompt self-contained — full file contents, rules, output format, verification command. |
| 6 | Is a subagent warranted at all, or is this one tool call? | Do it yourself. A subagent is a request; you are free. |
| 7 | Am I about to run a verification that the same evidence already established? | Skip. Verify once, not twice. |
| 8 | Would a second independent reviewer change what I'd do? | Dispatch `@verifier` only when self-verification failed. |

**Never dispatch N subagents serially.** Independent dispatches go in one message.

## Decision Order — Token Efficiency

| # | Rule | Mechanism |
|---|------|-----------|
| 1 | Scope retrieval to the frame that matches the question | `scope-context` — "load context about auth" reads `context/frameworks/auth*`, not all of `context/` |
| 2 | Reuse durable context instead of re-inlining it | `.opencode/context/` + `agentContext update-memory` / `update-notepad` |
| 3 | Let the tooling pre-strip the prompt before send | `prompt-compiler` (Task), vectorize-context injection (`<Relevant_Context>` / `<Relevant_Code>`, token-budgeted) |
| 4 | Prefer one precise call over three exploratory ones | Scoped `Grep` beats bare `Glob` plus a Read plus a re-Grep |
| 5 | Never re-read a file you already read this session, unless it changed | The `file` cache namespace is mtime-validated; `Write`/`Edit`/`bash` invalidate it |
| 6 | Cache Context7, SearXNG, `gh_grep` results before re-fetching | `mcp` namespace (7d), `context7` namespace (7d) |
| 7 | Persist expensive findings so the next session doesn't re-derive them | `artifacts` save/load, `research/code-snippets/` (per AGENTS.md) |

## Retrieval Ladder — Cheapest First

Embeddings and the vector stores exist so you do not have to re-read the world. Use them.

| Rank | Source | Cost | Reach for it when |
|-----:|--------|------|-------------------|
| 1 | Context already in the prompt | 0 requests | Always first. This is the free tier. |
| 2 | Cache namespace hit (`cache`, `agent-cache`, `semantic-cache`) | 0 requests | Repeat work, unchanged files, repeat docs lookups |
| 3 | `.opencode/context/` frame (scoped `Read`) | 1 request | Known file, need exact text |
| 4 | `graphQuery query` — vector recall → graph refine | 0 hosted requests (local embeddings + rerank) | You know the topic but not the file |
| 5 | `scope-context` | 0 hosted requests (local keyword scan) | Need to know which context files are relevant |
| 6 | `rerank` against a candidate list | 0 hosted requests (local ONNX) | Too many candidates to pick from |
| 7 | `Glob` / `Grep` / `Read` | cheap, 1 request | You don't know where the thing lives |
| 8 | Web search / `gh_grep` / Context7 | hosted + expensive | Nothing local answers it — **and check rank 2 and 7 first** |

Ranks 4–6 run on local ONNX embeddings and a local cross-encoder reranker — in-process, no daemon, no hosted API. They cost no provider tokens. Reaching
for a hosted search before a local vector query is the most common avoidable spend in this system.

## The Memory System

Context windows vanish; disk and the vector stores do not. That asymmetry is the whole reason for this
rule — a fact you looked up once should never be looked up twice.

| Layer | Location | Write when | Read when |
|-------|----------|-----------|-----------|
| Project memory | `agentContext update-memory` | Durable fact about this project | Start of a task touching it |
| Notepad | `agentContext update-notepad` | Working state mid-task | Resuming or handing off |
| Durable context | `.opencode/context/{frameworks,patterns,research,decisions.md,theory.md}` | A decision, pattern, or finding worth outliving the session | Frame matches the question |
| Artifacts | `artifacts save` | A skill produced a reusable work product | A later step or session needs it |
| Snippets | `.opencode/context/research/code-snippets/{slug}.md` | You pulled real code from the wild | Before paying for another `gh_grep` |
| Vector index | `graphQuery` (`.opencode/state/vector/`) | After a write, via the vectorize hook | Recall you can't route by path |

`/memory-hub` is the manual, user-invoked path for all of the above. **All context operations stay
manual** (see `context-strategy.md`) — this rule tells you to *check* durable memory before
re-deriving, and to *offer* to persist a finding. It does not authorise unprompted harvesting.

## Per-Turn Self-Check

Run this before ending a turn, not once per session.

| Check | Pass condition |
|-------|----------------|
| Batched? | All independent calls for this step went out in one message |
| Serialized needlessly? | Nothing waited on a return value it didn't need |
| Cached first? | Every deterministic/repeat lookup hit a cache tier before a hosted call |
| Retrieved narrowly? | No blanket directory reads where a frame or a `Grep` would do |
| Subagent prompts self-contained? | No "you also need to know…" follow-up turn |
| Re-derived anything? | Anything already in `.opencode/context/` or a cache was not re-fetched |
| Substance intact? | Nothing was cut from the *output* to serve either budget |

## Stop Condition

Efficiency work is done when the only remaining options would trade substance for cost. At that
point, stop optimising and finish the task. An unfinished task costs more than any token saved.
