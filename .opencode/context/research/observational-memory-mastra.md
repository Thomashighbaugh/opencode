# Observational Memory — Mastra Research

**Source:** https://mastra.ai/research/observational-memory
**Fetched:** 2026-06-22
**Author:** Tyler Barnes (Founding Engineer, Mastra)
**Tags:** memory, agents, long-context, benchmark, LongMemEval, open-source

---

## Summary

Observational Memory (OM) is a memory system developed by Mastra that achieves **94.87% on LongMemEval** with `gpt-5-mini` — the highest score ever recorded on this benchmark. It uses two background agents (Observer + Reflector) to maintain a dense, append-only observation log that replaces raw message history as it grows. The context window remains **stable, predictable, and fully prompt-cacheable** — no dynamic retrieval per turn.

---

## Key Results

| System | Model | Overall |
|--------|-------|---------|
| **Mastra OM** | **gpt-5-mini** | **94.87%** |
| **Mastra OM** | **gemini-3-pro-preview** | **93.27%** |
| Hindsight | gemini-3-pro-preview | 91.40% |
| **Mastra OM** | **gemini-3-flash-preview** | **89.20%** |
| Supermemory | gemini-3-pro-preview | 85.20% |
| **Mastra OM** | **gpt-4o** | **84.23%** |
| Oracle (filtered raw data) | gpt-4o | 82.40% |
| Full context (all ~50 convos) | gpt-4o | 60.20% |

- OM with `gpt-4o` (84.23%) is the **highest openly reproducible score** using the official benchmark model
- OM **beats the oracle** — its observations are more useful to the model than the raw correct data
- OM outperforms Hindsight's best by 3.5 points (Hindsight uses 4 parallel retrieval strategies + neural reranking)
- OM scales better with model quality than competitors (9pt gain from gpt-4o to gemini-3-pro vs 3.6pt for Supermemory)

---

## Architecture: Three-Tier System

### 1. Message History
Raw conversation — what was just said. Grows every turn.

### 2. Observations (Observer Agent)
A background **Observer** agent watches the conversation. When message history reaches a token threshold, it processes messages into concise, dated, prioritized notes — which then **replace** the messages they observed.

- **Compression:** 3–6× for text-only; 5–40× for tool-call-heavy workloads
- **Format:** Two-level bulleted lists with emoji prioritization (🔴 high, 🟡 medium, 🟢 low)
- **Temporal anchoring:** Each observation carries up to 3 dates (observation date, referenced date, relative date)
- **Tracks:** current task, suggested response (continuity mechanism)

### 3. Reflections (Reflector Agent)
When observations accumulate past a second token threshold, a **Reflector** agent restructures and condenses them: combining related items, reflecting on overarching patterns, dropping superseded context.

### Key Design Properties
- **Append-only** (until reflection) — context window is stable and cacheable
- **Token-budget driven** — triggers on token counts, not time intervals or message counts
- **No dynamic retrieval** — no per-turn injection based on user prompt
- **Average context window:** ~30k tokens for the entire LongMemEval run

---

## Temporal Anchoring (Three-Date Model)

Every observation carries:
1. **Observation date** — when the observation was created
2. **Referenced date** — the date mentioned in the content itself ("my flight is January 31")
3. **Relative date** — a computed relative offset ("2 days from today")

Critical for temporal reasoning — OM with `gpt-5-mini` scores **95.5%** on this category.

---

## Limitations

- **Multi-session** is the hardest category (87.2% best) — appears to be a ceiling current systems hit
- **Single-session-preference** is volatile (only 30 questions, statistically noisy)
- **gpt-4o** shows clear per-category gaps vs gpt-5-mini (temporal-reasoning +9.8, preference +26.7, assistant +12.5)

---

## OM vs Compaction

| Aspect | Observational Memory | Compaction |
|--------|-------------------|------------|
| Approach | Append-only event log | Bulk unstructured summarization |
| Frequency | Continuous, small increments | One-time when context overflows |
| Content | Specific events, decisions, changes | Gist of what happened |
| Compression | 3–6× text, 5–40× tool-call-heavy | Variable |
| Reflection | Rewrites observations to find connections, drop redundancy | N/A — full summarization |

---

## Relevance to OpenCode Hubs

OM's architecture is directly relevant to OpenCode's context management strategy:

1. **Stable context window** — aligns with OpenCode's goal of predictable, cacheable prompts
2. **Background observer pattern** — could inform a session-watching agent that extracts durable knowledge
3. **Three-date temporal model** — useful for OpenCode's state/context separation with timestamps
4. **Append-only with periodic reflection** — mirrors OpenCode's state (ephemeral) → context (durable) pipeline
5. **Open source** — implementation available at https://github.com/mastra-ai/mastra

---

## References

1. Wu, X., et al. ["LongMemEval: Benchmarking Chat Assistants on Long-Term Interactive Memory."](https://arxiv.org/abs/2410.10813) arXiv:2410.10813, 2024.
2. Kedia, A., et al. ["Hindsight: A Biomimetic Memory Architecture for Agents."](https://arxiv.org/abs/2512.12818) arXiv:2512.12818, 2025.
3. Mastra OM implementation: https://github.com/mastra-ai/mastra/tree/main/packages/memory/src/processors/observational-memory
4. LongMemEval runner: https://github.com/mastra-ai/mastra/tree/main/explorations/longmemeval
