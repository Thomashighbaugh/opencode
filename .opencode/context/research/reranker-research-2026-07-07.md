---
title: "Local Reranker Research — Complementing Embedding Models for JIT Context Injection"
type: research-report
tags: [reranker, embedding, RAG, local, context-injection, vector-search, cross-encoder]
created: 2026-07-07
updated: 2026-07-07
sources: [sbert-cross-encoder, rerankers-lib, flashrank, bge-reranker-v2-m3]
status: active
---

# Local Reranker Research

## Problem

Embedding models (bi-encoders) produce vector representations for semantic search. They're fast and scalable but imprecise — they compress meaning into a single vector, losing nuance. For JIT context injection (retrieving repo chunks to inject into prompts), this means top-K results often include noise while missing the truly relevant passages.

Rerankers (cross-encoders) solve this: they take the query + each candidate document as a **pair**, process them through a full transformer, and output a precise relevance score. They're slower (O(n) per query) but dramatically more accurate. Standard pattern: **retrieve top-50 with embeddings, rerank top-10 with cross-encoder**.

## Architecture for JIT Context Injection

```
User Query
    │
    ▼
[Embedding Model] ──ANN search──→ Top-K candidates (e.g. 50)
    │
    ▼
[Reranker (Cross-Encoder)] ──score each (query, doc) pair──→ Reranked top-N (e.g. 5-10)
    │
    ▼
[Inject into prompt context]
```

## Top Open-Source Local Reranker Options

### 1. FlashRank (⭐989) — Best for CPU/lightweight

| Model | Size | Notes |
|-------|------|-------|
| `ms-marco-TinyBERT-L-2-v2` | ~4MB | Default, blazing fast, competitive |
| `ms-marco-MiniLM-L-12-v2` | ~34MB | Best cross-encoder reranker |
| `rank-T5-flan` | ~110MB | Best zero-shot on out-of-domain data |
| `ms-marco-MultiBERT-L-12` | ~150MB | Multilingual (100+ languages) |
| `rank_zephyr_7b_v1_full` | ~4GB | LLM-based listwise reranker (GGUF quantized) |

**Key features:**
- No Torch/Transformers needed — runs on CPU with ONNX
- ~4MB default model — smallest reranker in existence
- `pip install flashrank` (pairwise) or `pip install flashrank[listwise]` (LLM-based)
- Apache-2.0 license

**Usage:**
```python
from flashrank import Ranker, RerankRequest
ranker = Ranker(max_length=128)
results = ranker.rerank(RerankRequest(query=query, passages=passages))
```

### 2. BAAI/bge-reranker-v2-m3 (⭐1.07k HF likes) — Best multilingual

| Property | Value |
|----------|-------|
| Base model | bge-m3 (XLM-RoBERTa) |
| Size | 0.6B params |
| Languages | Multilingual |
| License | Apache-2.0 |
| Downloads | 16.6M/month |

**Usage (FlagEmbedding):**
```python
from FlagEmbedding import FlagReranker
reranker = FlagReranker('BAAI/bge-reranker-v2-m3', use_fp16=True)
score = reranker.compute_score(['query', 'passage'])
scores = reranker.compute_score([['q1', 'p1'], ['q2', 'p2']])
```

**BGE Reranker family:**
| Model | Base | Best for |
|-------|------|----------|
| bge-reranker-base | xlm-roberta-base | Lightweight, fast inference |
| bge-reranker-large | xlm-roberta-large | Better performance |
| bge-reranker-v2-m3 | bge-m3 | Multilingual, strong all-around |
| bge-reranker-v2-gemma | gemma-2b | LLM-based, multilingual |
| bge-reranker-v2-minicpm-layerwise | MiniCPM-2B | Layerwise (8-40), selectable speed/quality tradeoff |

### 3. rerankers library (AnswerDotAI, ⭐1.6k) — Unified API for ALL rerankers

Single API wrapping every reranker type:

```python
from rerankers import Reranker

# Cross-encoder
ranker = Reranker('cross-encoder')
# Specific model
ranker = Reranker('mixedbread-ai/mxbai-rerank-large-v1', model_type='cross-encoder')
# FlashRank
ranker = Reranker('flashrank')
# T5 Seq2Seq
ranker = Reranker("t5")
# ColBERT
ranker = Reranker("colbert")
# LLM Layerwise
ranker = Reranker('llm-layerwise')

results = ranker.rank(query="...", docs=[...], doc_ids=[...])
results.top_k(5)  # Get top 5
```

**Supported model types:** cross-encoder, flashrank, t5, colbert, rankgpt, rankllm, llm-layerwise, API-based (Cohere, Jina, Pinecone, etc.)

### 4. Sentence-Transformers Cross-Encoders

The original cross-encoder framework. Pre-trained models on Hugging Face.

**Usage:**
```python
from sentence_transformers import CrossEncoder
model = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-12-v2')
scores = model.predict([(query, doc) for doc in docs])
```

## Integration Patterns for JIT Context Injection

### Pattern A: Two-stage (embed → rerank)

```
1. Embed query → ANN search → top-50 candidates
2. For each candidate: reranker.score(query, candidate_text)
3. Sort by reranker score → inject top-5
```

**Best for:** When you already have an embedding pipeline and vector store.

### Pattern B: Reranker-only (for small corpuses)

```
1. For each document: reranker.score(query, doc_text)
2. Sort by score → inject top-N
```

**Best for:** Small codebases (<1000 chunks) where embedding overhead isn't worth it.

### Pattern C: Hybrid (sparse + dense → rerank)

```
1. BM25 retrieval + embedding retrieval → union candidates
2. Reranker scores all candidates
3. Sort by reranker score → inject top-N
```

**Best for:** Code search where keyword matches (function names, imports) complement semantic matches.

## Serving Options

### Local Python process (simplest)
```python
# Load once at startup, keep in memory
ranker = FlagReranker('BAAI/bge-reranker-v2-m3', use_fp16=True)

# On each query
scores = ranker.compute_score([[query, doc.text] for doc in candidates])
```

### REST API (for decoupled services)
- **FastAPI wrapper** around any reranker
- **TEI (Text Embeddings Inference)** — Hugging Face's inference server supports rerankers natively
- **vLLM** — supports embedding/reranking endpoints

### Via Ollama (if available)
Ollama doesn't natively support reranker models yet. Workaround: use Ollama's LLM as a listwise reranker via prompt (e.g., "Rank these documents by relevance to the query..."). Slower but zero additional dependencies.

## Recommendations for This Project

| Priority | Model | Why |
|----------|-------|-----|
| **1st** | `BAAI/bge-reranker-v2-m3` | Multilingual, strong BEIR scores, same family as bge-m3 embeddings, Apache-2.0 |
| **2nd** | `ms-marco-MiniLM-L-12-v2` (via FlashRank) | 34MB, CPU-only, no PyTorch needed, fastest path to production |
| **3rd** | `mixedbread-ai/mxbai-rerank-large-v1` | Current SOTA open-source reranker, best zero-shot |

**Integration approach:**
1. Embedding model retrieves top-50 chunks from vectorized repo
2. Reranker scores each (query, chunk) pair
3. Top-5 reranked chunks injected into prompt
4. Reranker runs as local Python process (FastAPI wrapper if decoupled)

**Token budget consideration:** Reranker adds latency proportional to `candidates × max_length`. For 50 candidates at 512 tokens each, expect ~50-200ms on GPU, ~200-1000ms on CPU. Budget this into the JIT injection pipeline — the quality improvement (20-40% better retrieval precision) justifies the latency.

## References

- [Sentence-Transformers Cross-Encoders](https://www.sbert.net/examples/applications/cross-encoder/README.html)
- [rerankers library (AnswerDotAI)](https://github.com/AnswerDotAI/rerankers) — Apache-2.0, 1.6k⭐
- [FlashRank](https://github.com/PrithivirajDamodaran/FlashRank) — Apache-2.0, 989⭐
- [BAAI/bge-reranker-v2-m3](https://huggingface.co/BAAI/bge-reranker-v2-m3) — Apache-2.0, 1.07k HF likes
- [BGE Reranker family](https://github.com/FlagOpen/FlagEmbedding/tree/master) — Apache-2.0
- [CoALA: Cognitive Architectures for Language Agents](https://arxiv.org/abs/2309.02427) — agent memory model
