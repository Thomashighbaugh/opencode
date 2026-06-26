---
name: find-skills
description: Discover, vet, and install agent skills by searching across every major skill registry (skills.sh, clawhub.ai, GitHub) simultaneously, presenting top results with security scanning. Use when setting up a project (/init-project), when the user asks "how do I do X", "find a skill for X", or when you need to extend agent capabilities. Searches all major registries at once instead of trusting a single site's rankings.
---

# Find Skills

Find the right agent skill for a task by searching **every major registry at once** and presenting each board on its own native metric.

## When to Use

- Setting up a project (`/init-project setup` or `/init-project refresh`)
- The user asks "how do I do X" and X is a common task that likely has a published skill
- "find a skill for X" / "is there a skill for X" / "what should I install for X"
- You need to extend agent capabilities (testing, design, deployment, domain workflow)
- You're about to build something from scratch that a battle-tested skill might already cover

## Multi-Source Search Strategy

Each registry shows only its own slice, with different signals:

| Registry | Search Method | Signal | Blind Spot |
|----------|--------------|--------|------------|
| **skills.sh** | `GET /api/search?q=` | lifetime installs | no stars, install count lags ~2.5h |
| **GitHub topics** | `gh search repos --topic claude-skills --topic agent-skills --topic claude-code-skills` | repo stars, description | repo-level, not skill-level |
| **skills.sh API** | Fetch and rank by installs | cross-registry validation | smaller/newer registries |

**Always run 2-3 adjacent-term searches** before concluding. A single search misses great skills filed under sibling terms. For example, searching "ui ux design" tops at 19k, but "frontend design" surfaces a 443k install skill — completely invisible to the first query.

## How to Choose the Right Skill

**Step 1 — Read before you judge.** Never recommend from metadata alone. Open the actual SKILL.md of the top 2-3 candidates.

**Step 2 — Weigh signals in this order:**
1. **Fit** — Does the skill's documented behavior match the real need?
2. **Popularity as social proof** — Higher installs/stars means more validation
3. **Depth & maintenance** — Real examples, clear scope, recent updates
4. **Safety** — Check for risky patterns (curl-pipe-install, eval-remote, broad tool grants)

**Step 3 — Deliver a verdict, not a menu:**
- One **primary recommendation** with why
- 1-2 **alternatives** framed by need
- Only say "nothing fits" when you've read the top candidates and they genuinely don't

## Installation

```bash
npx skills add <owner>/<repo> --skill <slug> -g
```

## Integration with /init-project

This skill is used by `/init-project setup` and `/init-project refresh` to:
1. Search for skills relevant to the detected project stack (React, Next.js, Python, etc.)
2. Present findings for user selection
3. Install selected skills at the project scope

## Security & Privacy

- Issues read-only HTTP GETs to public APIs
- Requires no API keys or tokens
- Never auto-installs anything — always user-confirmed
- Security scan is a heuristic — a clean badge is not a security audit
