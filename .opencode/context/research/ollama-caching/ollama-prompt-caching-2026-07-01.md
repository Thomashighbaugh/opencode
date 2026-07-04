# Ollama Prompt Caching Research

> Fetched via Context7 MCP (/ollama/ollama) on 2026-07-01

## Summary

Ollama does NOT expose prompt-prefix caching at the API level. The `prompt_eval_count` in API responses always reflects the full prompt being re-evaluated, even for identical consecutive calls.

## What Ollama DOES Have

### 1. KV Cache (Internal, Not API-Exposed)
- Ollama maintains an internal KV cache during inference for the current session
- This speeds up token generation within a single request but does NOT persist across requests
- The `OLLAMA_KV_CACHE_TYPE` env var controls quantization (f16 default, q8_0, q4_0) for memory savings
- This is an inference optimization, not a prompt caching mechanism

### 2. Model Keep-Alive (`keep_alive`)
- `OLLAMA_KEEP_ALIVE` env var (default 5 minutes) controls how long a model stays loaded in GPU/CPU memory
- `keep_alive: -1` = infinite, `keep_alive: 0` = unload immediately
- This keeps the MODEL loaded, not the prompt KV cache
- Benefit: avoids model reload latency, but prompt tokens are still re-evaluated

### 3. `num_keep` Option
- The Options struct has a `NumKeep` field — this controls how many prompt tokens to keep in the KV cache during generation
- This is for generation continuity (keeping context within a single conversation turn), not for cross-request caching

## What Ollama Does NOT Have

- **No prompt-prefix caching** — no way to cache a system prompt prefix and skip re-evaluating it on subsequent calls
- **No cache hit API** — no endpoint to check if a prompt was already evaluated
- **No prompt hash deduplication** — identical prompts are fully re-processed

## Implications for Task 6

Prompt prefix deduplication cannot be delegated to Ollama. If we want to avoid re-sending the same system prompt prefix:
- Must be done at the OpenCode plugin layer (before the request reaches Ollama)
- Or accept the full prompt cost on every call (current behavior)
- The `chat.params` hook could modify the request, but there's no way to tell Ollama "reuse the cached prefix"
- The only viable approach is the `llm-cache` semantic cache — intercept before Ollama, return cached full response

## Test Evidence

```
Call A (identical prompt): prompt_eval=11, total=710000994
Call B (identical prompt): prompt_eval=11, total=1165340828
```
Both calls show full prompt re-evaluation. The second call was actually slower (likely due to model reload or inference variance).