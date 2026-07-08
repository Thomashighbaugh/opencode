- [x] caveman mode — rewrote `rules/output-compression.md` to model caveman speech instead of describing it. Now uses fragments, dropped articles, imperative tone. The instruction's form matches its content.
- [x] embedding model swap — `nomic-embed-text` → `mxbai-embed-large` in `tools/semantic-cache.ts`
- [x] reranker tool — `tools/rerank.ts` wrapping Ollama `/api/rerank` endpoint. Default model: `hans-tech/bge-reranker-v2-m3:260522`
- [x] reranker research — saved to `.opencode/state/harvest/reranker-research-2026-07-07.md`
- [x] local focus plugin — `plugins/core/focus.ts` — zero external deps, integrated into hooks.ts system.transform for hub command steering
- [x] context ingestion — opencode-memoir, opencode-dispatcher, opencode-goal-plugin, brain-memory all saved to `.opencode/context/research/`

- [ ] comprehensive test suite — TypeScript evals for global and per-project configs, runnable via GitHub Actions
- [ ] init-project setup — auto-pull `mxbai-embed-large` and `hans-tech/bge-reranker-v2-m3:260522` during project init
