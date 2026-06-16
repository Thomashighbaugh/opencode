# Patterns for Building AI Agents

**Source:** "Patterns for Building AI Agents" by Sam Bhagwat & Michelle Gienow (Mastra, 2025)
**Ingested:** 2026-05-03
**Pages:** 93
**Format:** Extracted PDF markdown

---

## Overview

A pragmatic guide to building production AI agents, organized into 22 patterns across 5 parts. Complements the conceptual *Principles of Building AI Agents* with real-world, battle-tested patterns from companies, model labs, and startups.

---

## Part I: Configure Your Agents

### 1. Whiteboard Agent Capabilities

**Problem:** Agent feature overload — deciding where to start and how to build.

**Solution:** Organizational design for agents. Use an **inside-out** approach:
1. Write down everything you want the agent to do
2. Group similar capabilities (same data sources, same job title, same API calls)
3. Figure out natural divisions/departments
4. Rank order by priority

**Key insight:** The structure isn't clear when you start. By the end, you have a list of agents with tools, rank ordered by priority.

### 2. Evolve Your Agent Architecture

**Problem:** Monolithic mega-agents that try to handle every task.

**Solution:** Iterative discovery:
1. List tasks you want your agent to perform
2. Start with the one burning problem
3. Build that agent really well
4. Notice what users ask for next
5. Build a new agent for separate concerns
6. If unwieldy, split it
7. If multiple agents, add routing logic
8. Repeat

**Key insight:** Each specialized agent has a cohesive toolchain, focused on a specific domain with clear success criteria. Most production agents are not mega-agents but orchestrated specialists.

### 3. Dynamic Agents

**Problem:** User realities change constantly — different user types, queries, and system states.

**Solution:** Agents that adapt at runtime — adjusting reasoning, tools, memory, and model based on runtime signals (user roles, preferences, system state).

**Example:** A support agent differentiating between free tier (basic docs), pro users (detailed technical support), and enterprise (priority + human escalation).

### 4. Human-in-the-Loop

**Problem:** Full agent autonomy is often untenable — performance is heterogeneous across task types.

**Solution:** Design agents to incorporate human checkpoints. Key patterns:
- **In-the-loop:** Agent pauses mid-execution for human input
- **Deferred tool execution:** Agent pushes action for review (e.g., PR) but continues background work
- **Post-processing:** Human reviews before finalization (e.g., editing generated email)

**Challenge:** Humans become the bottleneck — agents don't sleep, but humans do.

---

## Part II: Engineer Agent Context

### 5. Parallelize Carefully

**Problem:** Parallel subagents create incompatible outputs when unaware of each other.

**Solution:** Use single-threaded linear agents for tasks where parallel subagents would produce conflicting results.

**Key insight:** Different teams disagree on this. Devin (Cognition) avoids parallelizing tasks; Claude Code relies heavily on parallel subagents.

### 6. Share Context Between Subagents

**Problem:** Subagents working in isolation produce mutually incompatible outputs.

**Solution:** Share full traces between subagents — not just results but the reasoning, research, and user approvals that led to decisions.

### 7. Avoid Context Failure Modes

**Problem:** Larger context windows aren't free. Five failure modes:
1. **Context poisoning:** Errors in context get repeatedly referenced
2. **Context distraction:** Model overfocuses on middle of long context
3. **Context confusion:** Irrelevant context used to generate low-quality response
4. **Context clash:** New info conflicts with previous info in context
5. **Context rot:** ~100K tokens, models start losing ability to discern important info from noise

**Solution:** Context engineering — RAG filtering, pruning tools, structured context storage, compiled strings.

**Example:** Google Gemini team's Pokemon agent benchmark — performance degraded at ~125K tokens despite 500K context window. Fixing improved accuracy from 34% to 90%+.

### 8. Compress Context

**Problem:** Context overflow — responses degrade as tokens approach the context window limit.

**Solution:** Periodic compression strategies:
- Compress at every step (Anthropic approach)
- Compress when x% threshold reached (e.g., 95%)
- Prune oldest context (hierarchical summarization)
- Summarization at agent-agent boundaries
- Token limiters and tool call filters

**Note:** Don't compress crucial events/decisions — identify what's critical first.

### 9. Feed Errors Into Context

**Problem:** LLM-generated code sometimes doesn't work.

**Solution:** Give the agent the error message + code + relevant context → agent generates fixes → applies them → re-executes. If common error patterns emerge, add them to the prompt.

**Used by:** Cursor (Auto Run mode), Windsurf (console errors to context), Replit Agent (automated feedback loop), Lovable (background debugging).

---

## Part III: Evaluate Agent Responses

### 10. List Failure Modes

**Problem:** AI outputs are nondeterministic — measuring quality is difficult.

**Solution:** Create a classification process that categorizes failures AND why they occur. Includes data quality, reasoning failure, and domain-specific rules application.

### 11. List Critical Business Metrics

**Problem:** Testing the right things — evals may not capture business objectives.

**Solution:** Use a mix of:
- Accuracy metrics (false positive/negative, overall accuracy)
- Domain-specific outcome metrics (missed terms, dollar loss prevention)
- Human team metrics (equivalent human task performance)

### 12. Cross-Reference Failure Modes and Success Metrics

**Problem:** Turning metrics into actionable insights.

**Solution:** Visualize failure modes vs success metrics. Workflow:
1. SME review — classify live production outputs
2. PM prioritization — cross-reference, set performance targets
3. Engineering — experiment using failure-mode-specific datasets
4. PM validation — review against production data, go/no-go decision

### 13. Iterate Against Your Evals

**Problem:** Detecting change impacts — improvements in one area may cause regressions elsewhere.

**Solution:** Measure against test datasets in CI. Establish: clear starting point (e.g., 95% accuracy), specific target (99%), way to test progress, confidence in direction.

### 14. Create an Eval Test Suite

**Problem:** Tracking performance and preventing regressions.

**Solution:** Test suite approaches:
- LLM-generated synthetic datasets
- Internal user data
- SME "golden answer" datasets (input/output pairs)
- LLM-as-judge with rubrics

### 15. Have SMEs Label Data

**Problem:** Software engineers are not domain experts — they can't judge domain-specific accuracy.

**Solution:** Domain experts review/validate agent outputs. Use inter-rater reliability metrics. Build intuitive review UIs with full traces (input, tool calls, LLM reasoning).

### 16. Create Datasets from Production Data

**Problem:** Real data is messy — needs transformation into clean, labeled datasets.

**Solution:** Use LLM observability tools to extract, curate, and version production datasets. Key fields: inputs, expected outputs, metadata.

### 17. Evaluate Production Data

**Problem:** Synthetic data doesn't match production reality.

**Solution:** LLM-as-judge — define evaluation prompt, decide scoring method (binary, categorical, or numerical — prefer the first two), define sampling frequency.

---

## Part IV: Secure Your Agents

### 18. Prevent the Lethal Trifecta

**Problem:** Three features together enable prompt injection attacks:
1. **Access to private data** (emails, files, documents)
2. **Exposure to untrusted content** (web pages, documents with hidden instructions)
3. **External communication ability** (email, API calls, PR submissions)

**Solution:** Remove any one leg. Easiest: remove the exfiltration vector. Add input processors (middleware for agent conversations — guardrails, content moderation, security controls).

**Real-world exploits:** Microsoft Copilot, Cursor, Jira, Zendesk, ChatGPT, Claude, Gemini.

### 19. Sandbox Code Execution

**Problem:** Code-executing agents have the same risks as PaaS platforms — intentional harm, resource hogging.

**Solution:** Secure, resource-limited sandboxed environments. Agentic runtimes (E2B, Daytona) solve Docker's cold-start problem (10-20 seconds vs <1 second).

### 20. Granular Agent Access Control

**Problem:** Agents are ephemeral with unpredictable behavior. Public MCP servers with broad API keys are risky.

**Solution:** More granular access than for humans:
- OAuth flows with MCP authorization
- Per-tool-call access control with just-in-time credentials
- Planning mode with lower permissions (read-only for database changes)

### 21. Agent Guardrails

**Problem:** Real-time intervention — evals are after-the-fact, but you need live protection.

**Solution:**
- **Input guardrails:** Block prompt injection, jailbreaking, sensitive PII before reaching LLM
- **Output guardrails:** Prevent data leakage, hallucination, bias, toxicity before reaching user
- **Custom guardrails:** Brand/topic constraints (e.g., "don't talk about competitors")
- **Chunked streaming guardrails:** Inspect each chunk + final output

---

## Part V: The Future

### 22. What's Next(ish)

Three emerging trends:
1. **Simulations** — Find optimal parameters (prompts, retrieval settings) through simulation
2. **Agent learning** — Agents don't yet improve with practice like humans; promising approaches emerging
3. **Synthetic evals** — Automating the tedious eval-creation process

**Quote:** "2025 may be the year of agents, but 2025-2035 will be the decade of agents." — Andrej Karpathy

---

## Key Takeaways for Hubs

- **Start small, iterate:** Don't build a mega-agent. Start with one burning problem, split as you grow.
- **Context engineering > prompt engineering:** Manage context windows, compress strategically, feed errors back.
- **Evals are a discipline:** Classify failure modes, cross-reference with business metrics, use SMEs, monitor production.
- **Security by constraints:** Remove one leg of the lethal trifecta, sandbox code, use guardrails.
- **Share full context:** Subagents need full traces, not just results.

## References

- Anthropic, "Building Effective Agents" — https://anthropic.com/engineering/buildingeffectiveagents
- Walden Yan, "Don't Build Multi-Agents" (Cognition) — https://cognition.ai/blog/dontbuildmultiagents
- Simon Willison, "The Lethal Trifecta" — https://simonwillison.net/2025/Jun/16/thelethaltrifecta/
- Hamel Husain, "Evals FAQ" — https://hamel.dev/blog/posts/evalsfaq/
- Drew Breunig, "How Contexts Fail" — https://dbreunig.com/2025/06/22/howcontextsfailandhowtofixthem.html
- Lance Martin, "Context Engineering for Agents" — https://rlancemartin.github.io/2025/06/23/context_engineering/
