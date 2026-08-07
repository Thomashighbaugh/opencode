---
name: model-routing-architecture
tags: [routing, failover, model-tiering, subagent]
---

# Model Routing Architecture

## Three-Tier Failover Chain

Subagents use a failover chain per tier. Primary → F1 → F2 → (F3 NVIDIA NIM optional). Stop on first success.

| Tier | Primary | F1 | F2 | Agents |
|------|---------|----|----|--------|
| **Pro** | `ollama/deepseek-v4-pro:cloud` | `opencode-go/deepseek-v4-pro` | `opencode/deepseek-v4-flash-free` | architect, planner, security-reviewer, etc. |
| **Default** | `opencode/deepseek-v4-flash-free` | `ollama/deepseek-v4-flash:0731-cloud` | `opencode-go/deepseek-v4-flash` | executor, debugger, test-engineer, etc. |
| **Fast** | `opencode/deepseek-v4-flash-free` | `ollama/glm-5.2:cloud` | `opencode-go/glm-5.2` | writer, verifier, document-specialist, etc. |

**Rules:**
- 60-second timeout advances the chain (not fixed retry count)
- Provider errors (connection refused, 502/503/504, rate limit) → advance chain
- Task errors (wrong output) → fix prompt, don't advance
- Tool errors (file not found) → fix cause, don't advance
- Chain exhausted → escalate via `question` tool
- **Ambiguity default:** When routing is uncertain (task doesn't clearly fit a tier, unclear model choice), default to `opencode/deepseek-v4-flash-free` — the free, always-available model. Never default to paid/cloud models when uncertain.

## Task-to-Tier Routing

| Task Type | Route To |
|-----------|----------|
| Architecture, security audit, strategic planning, complex debugging | Pro tier |
| Implementation, testing, code review, debugging, design | Default tier |
| Documentation, verification, codebase search | Fast tier |

## Session Model Authority

Agent frontmatter `model:` field is authoritative over `opencode.jsonc` `model:` field. To change a hub agent's model, update both the frontmatter in `agents/<name>.md` and `opencode.jsonc`.

## Key Tool Behaviors

- `json-edit` rewrites JSONC with 2-space indent (preserves comments)
- `node -e` JSONC validation with comment-stripping regex may fail on complex files — use temp `.mjs` files for accuracy
- `Edit` (exact string) may hit payload limits on large blocks — prefer `Edit` (regex) or `regex-edit`
