# Agent Systems Handbook (by Prompthon)

> **Source**: https://github.com/Prompthon-IO/agent-systems-handbook
> **Ingested**: 2026-06-08
> **Stars**: 315 | **Forks**: 52 | **Commits**: 135 | **Latest Release**: 2026-06-07

## Overview

A practical AI agents handbook covering agent systems, agentic workflows, LangGraph, MCP/A2A, context engineering, agent memory, evaluation, observability, and multi-agent architecture. Published by Prompthon Agentic Labs at [labs.prompthon.io](https://labs.prompthon.io/).

The handbook is designed for **three parallel tracks**:
1. **Explorer** — broad understanding, trends, and foundational ideas (no engineering required)
2. **Practitioner** — applying AI tools and workflows to daily work (one-person-company style)
3. **Builder** — building agent applications, from agent loops to startup-style products

## Repository Structure

| Directory | Content |
|-----------|---------|
| `foundations/` | Core concepts: agent definition, agents vs workflows, history, LLM foundations |
| `patterns/` | Agentic workflow patterns: planning/reflection, reasoning/control, memory/retrieval, agent runtime building blocks |
| `systems/` | System-level topics: protocols (MCP/A2A/ANP), context engineering, evaluation/observability, agent UI protocols |
| `ecosystem/` | Framework comparisons, agent platforms/low-code builders, model ecosystem map, AI builder tools directory |
| `case-studies/` | Real-world patterns: coding agents, customer-support agents, deep research agents |
| `skills/` | Reusable skill packages (prompt-cache, safety-escalation, news-watcher, etc.) |
| `workshops/` | Hands-on workshop materials (Codex, desktop agents, OpenClaw) |
| `radar/` | Trend monitoring: prompt injection, agent-first devices, interoperability, safety escalation, etc. |

## Key Concepts

### What Is an Agent System (Mental Model)
Agent systems are **software loops**, not just chat surfaces. The core loop: perceive → reason → act → observe → repeat. Tool use, memory, and environment boundaries are first-class design concerns.

### Agents vs Workflows
- **Deterministic workflows**: fixed DAG of steps, predictable, easy to debug
- **Bounded autonomy**: agent has freedom within defined guardrails
- **Hybrid design**: workflow orchestrates agent steps for complex tasks

### Planning & Reflection Patterns
- **Planning** reduces drift on multi-step structured tasks. Two-phase: generate a task plan → execute against it.
- **Reflection** improves quality when first drafts are cheap. Three-phase: produce initial answer → critique → refine.
- Useful defaults: plan when >1 dependency chain; reflect when quality justifies another pass; stop iterating when review no longer changes the decision.

### Protocol Interoperability (MCP / A2A / ANP)

Three protocol families, each solving a different layer:

| Layer | Protocol | Boundary |
|-------|----------|----------|
| **Access** | **MCP** (Model Context Protocol) | How a model reaches tools, resources, and capabilities |
| **Collaboration** | **A2A** (Agent-to-Agent) | How agents delegate and coordinate across roles |
| **Network** | **ANP** (Agent Network Protocol) | How agents are discovered and routed across networks |

#### MCP Specifics (Important for OpenCode)
- **Local stdio**: simplest for personal tools, project scripts — tied to the user's machine
- **Remote MCP**: for shared services and cloud integrations (OpenAI Responses API supports this)
- **Roots**: filesystem boundaries — explicit permission boundaries, not convenience hints. Tell the server which directories are in scope.
- **Resources**: application-provided context objects (files, DB schemas, project records) — selected context, not blanket permission.
- **Key rule**: `roots` = operating boundary; `resources` = context surface. Keeping these separate prevents the mistake of giving an agent broad "file access" without explaining which local area is allowed.

### Context Engineering
Context is not just "prompt size." Design decisions include:
- What goes into system context vs. user context vs. tool context
- How memory systems (short-term, working, long-term) interact
- How retrieval is scoped and freshened

### Agent Memory
- Lightweight memory benefits planning + reflection (plans, critiques, prior drafts need to persist without overwhelming context)
- Agentic RAG, structured memory stores, and context window management

### Evaluation & Observability
- Production agents need eval-first design: define metrics before building the loop
- Observability: traces, logs, and intermediate state inspection are critical for debugging agent behavior

## Current Trend Focus Areas

From the `radar/` directory (active as of June 2026):
1. **Prompt injection defenses & authority boundaries** — May 2026
2. **Emerging agent runtimes** — agent-first devices, desktop agents
3. **Production AI workflow patterns** — customer-support agent evaluation tradeoffs
4. **Safety escalation workflows** — assistant safety escalation watch
5. **Multi-agent orchestration** — A2A protocol maturity tracking
6. **Agentic shopping assistants** — May 2026 trend
7. **OpenAI multicloud managed agents** — May 2026

## Skill Packages (from `skills/`)

Reusable skill packages in the handbook:
- `agent-runtime-cache-benchmark` — benchmark different cache strategies
- `daily-news-watcher` — automated news monitoring agent
- `garbage-collector` — context/memory cleanup agent
- `local-document-organizer` — file organization agent
- `personal-knowledge-capture` — knowledge management agent
- `price-watcher` — price monitoring agent
- `prompt-cache-agent-harness` — prompt caching for agent loops
- `safety-escalation-review` — safety review escalation agent

## Relevance to OpenCode Hubs

This handbook is directly relevant to OpenCode Hubs because:

1. **Multi-agent architecture** — directly informs our hub routing, delegation, and orchestration patterns
2. **Protocols (MCP)** — we already use Context7 MCP; MCP roots/resources concepts map to our `.opencode/context/` vs `.opencode/state/` separation
3. **Planning & Reflection** — our `/orchestrate` patterns (ralph, autopilot, plan-execute) implement these exact patterns
4. **Context engineering** — our context-strategy.md and hub-state.md (state vs context, frame retrieval) are a concrete implementation
5. **Evaluation & observability** — relevant to `verify` skill, `verifier` agent, and convergence quality gates
6. **Skill packages** — our 64 skills are a similar concept; the handbook's skill organization can inform our skill-creator patterns

## Key Takeaways

- **Agent = loop, not chat**: the perceibe-reason-act-observe loop is the core abstraction
- **Protocol layering**: MCP for tools, A2A for agents, ANP for discovery — don't confuse the layers
- **Roots vs Resources**: operating boundary vs context surface — critical design distinction
- **Plan & Reflect**: add planning for multi-step tasks, add reflection when quality matters
- **Start small with protocols**: direct integration first, adopt protocols when portability/reuse matters more than simplicity