---
name: llm-cache
description: Semantic LLM response cache — caches and retrieves LLM responses for semantically similar prompts using vector similarity
level: 2
---

# LLM Cache — Semantic Prompt Caching

Uses the existing vector index infrastructure (sqlite-vec) to cache LLM responses for semantically similar prompts. When a prompt is semantically similar (cosine similarity > 0.92) to a previously cached prompt, the cached response is returned instead of making a fresh LLM call.

## How It Works

1. **On LLM call**: Compute embedding of the prompt (minus dynamic context like file contents)
2. **Query vector index**: Search for similar cached prompts
3. **Cache hit** (similarity > 0.92): Return cached response
4. **Cache miss**: Execute LLM call, cache the response

## Storage

- **Vector index**: `.opencode/.vector/` (sqlite-vec, gitignored)
- **Cache entries**: `.opencode/cache/llm/{hash}.json`
- **Embedding model**: `Xenova/all-MiniLM-L6-v2` (shared with vectorize-context)

## Cache Key Structure

Cache keys are derived from the **structural prompt** — the prompt with dynamic context (file contents, error messages, timestamps) stripped. This means:
- "List subcommands for /ideation" → same key every time
- "Explain how React hooks work" → same key every time
- "Fix this error: [specific error]" → different key per error

## TTL

- General prompts: 1 hour
- Static/system prompts: process lifetime
- Structural queries (subcommand listings, help text): 24 hours

## Usage

This skill is invoked automatically by the cache system in `plugins/hubs-plugin.ts`. It can also be triggered manually:

```
/harvest-context cache llm "your prompt here"
```

## Related

- `cache-utils.ts` — Shared cache infrastructure
- `vectorize-context` — Vector index management
- `/harvest-context cache` — Cache management commands
