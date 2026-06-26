---
name: find-agents
description: Discover, vet, and install AI agents by searching across agent registries and GitHub. Use when setting up a project (/init-project), when the user asks "find an agent for X", or when you need to extend agent capabilities with specialized subagents. Searches multiple sources simultaneously instead of trusting a single registry.
---

# Find Agents

Find the right agent for a task by searching across **agent registries** and **GitHub** simultaneously.

## When to Use

- Setting up a project (`/init-project setup` or `/init-project refresh`)
- The user asks "find an agent for X" or "is there an agent that does X"
- You need to extend agent capabilities with specialized subagents
- You're about to build a new agent from scratch that a published one might already cover

## Multi-Source Search Strategy

| Registry | Search Method | Signal | Blind Spot |
|----------|--------------|--------|------------|
| **skills.sh** | `GET /api/search?q=` (filter agent category) | lifetime installs | smaller corpus |
| **GitHub topics** | `gh search repos --topic ai-agent --topic agent-framework --topic autonomous-agent` | repo stars, description | repo-level, not agent-level |
| **skills.sh API** | Fetch and rank by installs | cross-registry validation | newer registries have less data |

## How to Choose

**Step 1 — Read before you judge.** Never recommend from metadata alone. Get the actual agent definition.

**Step 2 — Weigh signals in this order:**
1. **Fit** — Does the agent's described behavior match the real need?
2. **Quality signals** — Installs/stars, maintenance recency, documentation quality
3. **Scope** — Is it focused or a grab-bag?
4. **Safety** — Check what tools/permissions it requests

**Step 3 — Deliver a verdict, not a menu:**
- One **primary recommendation** with why
- 1-2 **alternatives** framed by need
- If nothing fits, offer to scaffold a custom agent

## Installation

For skills.sh agents:
```bash
npx skills add <owner>/<repo> --skill <agent-name> -g
```

For GitHub agents, direct the user to the repo for setup instructions.

## Integration with /init-project

This skill is used by `/init-project setup` and `/init-project refresh` to:
1. Search for agents relevant to the detected project stack and needs
2. Present findings for user selection
3. Install selected agents

## Security & Privacy

- Issues read-only HTTP GETs to public APIs
- Requires no API keys or tokens
- Never auto-installs anything — always user-confirmed
- Check agent permissions before installation — agents run with configured permissions
