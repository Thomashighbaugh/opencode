---
title: "LLM Wiki Index"
type: concept
tags: [wiki, index, catalog]
created: 2026-07-04
updated: 2026-09-30
status: active
---

# LLM Wiki Index

Auto-maintained catalog, regenerated from the files on disk by
`skills/graph-context/scripts/regen-index.ts`.

Every `[[slug]]` below resolves to a real page. A slug is the page path
relative to `.opencode/` without the `.md` extension, which is how the graph
keys the same nodes — so a link here and a graph edge resolve identically.

## Regenerating

```bash
npx tsx skills/graph-context/scripts/regen-index.ts
npx tsx skills/graph-context/scripts/graph.ts build
```

`graph.ts build` reports `skippedLinks` in its wiki stats. A non-zero count
means some link in this tree names a page that does not exist — that is the
check that stops this file drifting again.

## Research (External Sources)

| Page | Type | Tags | Status |
|------|------|------|--------|
| [[context/research/advances-in-agentic-ai]] | — | — | — |
| [[context/research/agent-systems-handbook-prompthon]] | — | — | — |
| [[context/research/agentic-ai-cybersecurity-survey]] | academic-paper | — | — |
| [[context/research/agentic-self-improvement-2026]] | source-summary | recursive-self-improvement, rsi, self-improving-agent, coding-agent, trust-layer, autonomy, feedback-loop, guardrails, agenttrust, weco-aide2, karpathy-autoresearch | active |
| [[context/research/arcanum]] | source-summary | opencode, plugin, monorepo, skills, memory, cli, agent, runecraft | active |
| [[context/research/auto-moc-rsi]] | source-summary | recursive-self-improvement, rsi, maps-of-content, moc, zettelkasten, taxonomy-learning, quality-scoring, rule-improvement, trust-scoring, autonomy, evidence-gating | active |
| [[context/research/brain-memory]] | source-summary | opencode, plugin, memory, mcp, brain, neuroscience, spaced-repetition, file-system, agent-memory | active |
| [[context/research/bros-harness-opencode-plugin]] | — | — | — |
| [[context/research/caveman]] | source-summary | opencode, claude-code, codex, gemini, skill, compression, tokens, caveman, prompt-engineering | active |
| [[context/research/ecc-agent-harness-guides]] | — | — | — |
| [[context/research/karpathy-guidelines/20260711_karpathy-guidelines]] | research | coding-standards, ai-coding | — |
| [[context/research/lit-search-cite]] | source-summary | opencode, claude-code, skill, academic, literature-search, cnki, pubmed, arxiv, citation | active |
| [[context/research/llm-wiki/karpathy-llm-wiki]] | — | — | — |
| [[context/research/mastering-ai-agents]] | book | — | — |
| [[context/research/mastering-ai-agents-handbook]] | — | — | — |
| [[context/research/nuum-agent-memory-sanity]] | — | — | — |
| [[context/research/observational-memory-mastra]] | — | — | — |
| [[context/research/ollama-caching/ollama-prompt-caching-2026-07-01]] | — | — | — |
| [[context/research/opencode-agent-skills-sessions]] | — | — | — |
| [[context/research/opencode-command-hooks/20260929_000000_reference-shanebishop1-opencode-command-hooks]] | — | research, plugin, hooks, opencode, event-driven, shell, injection | complete |
| [[context/research/opencode-config-schema]] | — | — | — |
| [[context/research/opencode-deep-memory]] | source-summary | opencode, plugin, memory, context, bm25, persistent-memory, compression | active |
| [[context/research/opencode-dispatcher]] | source-summary | opencode, plugin, workflow, agents, orchestration, task-artifacts, permission-model | active |
| [[context/research/opencode-dux]] | source-summary | opencode, plugin, orchestration, agents, llm, claude, gpt, gemini | active |
| [[context/research/opencode-goal-plugin]] | source-summary | opencode, plugin, goal, auto-continue, session, hooks, state-machine | active |
| [[context/research/opencode-joc-overview/20260719_catalog-and-patterns]] | source-summary | hubs, orchestration, agents, skills, commands, patterns | active |
| [[context/research/opencode-manifold]] | source-summary | opencode, plugin, multi-agent, orchestration, persistent-memory, state-machine, gpl3 | active |
| [[context/research/opencode-memoir]] | source-summary | opencode, plugin, memory, memoir, mcp, git, versioned-memory | active |
| [[context/research/opencode-model-config-and-provider-gating]] | — | opencode, config, model, provider, troubleshooting | — |
| [[context/research/opencode-self-improvement-2026]] | source-summary | opencode, self-improvement, rsi, skillforge, curator, skillinjector, autoresearch, reflexion, memory, rule-promotion, learning-loop, benchmark, graduation | active |
| [[context/research/opencode-websearch-cited]] | source-summary | opencode, plugin, websearch, citations, agent, google, openai, openrouter | active |
| [[context/research/openhands/20260711_openhands]] | research | agentic, ai-coding | — |
| [[context/research/openloops]] | source-summary | loops, scheduler, daemon, agents, opencode, cli, workflow | active |
| [[context/research/patterns-for-building-ai-agents]] | — | — | — |
| [[context/research/ponytail/20260711_ponytail]] | research | agentic, ai-coding, lazy-dev | — |
| [[context/research/prompt-engineering-survey]] | academic-paper | — | — |
| [[context/research/recursive-self-improvement]] | source-summary | recursive-self-improvement, rsi, agent, claude-code, trust, autonomy, feedback-loop, graduation, confidence-scoring | active |
| [[context/research/relearning-flow-kedbin]] | — | — | — |
| [[context/research/reranker-research-2026-07-07]] | research-report | reranker, embedding, RAG, local, context-injection, vector-search, cross-encoder | active |
| [[context/research/short-leash-ai-method-okturtles]] | — | — | — |
| [[context/research/systematic-debugging]] | — | — | — |

## Frameworks (Architecture & Design)

| Page | Type | Tags | Status |
|------|------|------|--------|
| [[context/frameworks/api-usage-minimization]] | — | — | — |
| [[context/frameworks/architecture]] | — | — | — |
| [[context/frameworks/per-repo-customization-engine]] | — | — | — |
| [[context/frameworks/per-repo-deployment-architecture]] | — | — | — |
| [[context/frameworks/smart-prompt-queue]] | — | — | — |
| [[context/frameworks/stall-detection-and-recovery]] | — | — | — |

## Patterns & Practices

| Page | Type | Tags | Status |
|------|------|------|--------|
| [[context/patterns/bash-code-generation]] | — | bash, template-literals, escaping, patterns | — |
| [[context/patterns/conventions]] | — | — | — |
| [[context/patterns/craftsman-agent]] | — | — | — |
| [[context/patterns/hub-skill-conventions]] | — | — | — |
| [[context/patterns/hub-skill-patterns]] | — | hubs, frontmatter, prompts, skills | — |
| [[context/patterns/hub-subcommand-latency]] | — | — | — |
| [[context/patterns/intent-router]] | — | — | — |
| [[context/patterns/model-routing-architecture]] | — | routing, failover, model-tiering, subagent | — |
| [[context/patterns/privacy-scan-pattern]] | — | — | — |
| [[context/patterns/skill-frontmatter-schema]] | — | frontmatter, schema, skills | — |
| [[context/patterns/template-literal-bash-generation]] | — | — | — |

## Docs

| Page | Type | Tags | Status |
|------|------|------|--------|
| [[context/docs/agent-tiers]] | entity | docs, agents, model-tiers | active |
| [[context/docs/agents]] | entity | docs, agents, reference | active |
| [[context/docs/AGENTS]] | concept | docs, index, reference | active |
| [[context/docs/commands]] | entity | docs, commands, reference | active |
| [[context/docs/execution-modes]] | entity | docs, execution-modes, orchestration | active |
| [[context/docs/installation]] | entity | docs, installation, setup | active |
| [[context/docs/model-configuration]] | entity | docs, models, configuration | active |
| [[context/docs/new-agents]] | entity | docs, agents, creation | active |
| [[context/docs/path-conventions]] | entity | docs, paths, conventions | active |
| [[context/docs/plugin-system]] | entity | docs, plugins, hooks | active |
| [[context/docs/routing]] | — | — | — |
| [[context/docs/skills]] | entity | docs, skills, reference | active |
| [[context/docs/state-management]] | entity | docs, state, persistence | active |
| [[context/docs/testing]] | entity | docs, testing, config-integrity | active |
| [[context/docs/tools]] | entity | docs, tools, reference | active |

## Sessions

| Page | Type | Tags | Status |
|------|------|------|--------|
| [[context/sessions/2026-08-09-session-compact-knowledge-graph]] | synthesis | session-compact, knowledge-graph, hybrid-retrieval, self-improvement, graph-context, tui-menu | active |

## Top Level

| Page | Type | Tags | Status |
|------|------|------|--------|
| [[context/decisions]] | — | — | — |
| `index.md` (this file) | concept | wiki, index, catalog | active |
| [[context/log]] | concept | wiki, log, changelog | active |
| [[context/theory]] | — | — | — |
| [[context/wiki-schema]] | concept | wiki, schema, meta | active |
