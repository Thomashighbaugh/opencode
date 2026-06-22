# ECC: The Agent Harness Operating System — affaan/cogsec Guides

**Source:** https://github.com/affaan-m/ECC
**Fetched:** 2026-06-22
**Author:** affaan (cogsec)
**Tags:** claude-code, agent-harness, ECC, skills, hooks, subagents, MCP, security, token-optimization, agentic-security

---

## Overview

ECC (Everything Claude Code) is a harness-native operator system for agentic work — 211.9K+ stars, 32.5K+ forks, 230+ contributors. Covers 12+ language ecosystems and 7+ agent harnesses (Claude Code, Codex, Cursor, OpenCode, Gemini, Zed, GitHub Copilot). Three canonical guides: Shorthand (setup), Longform (advanced patterns), Security (agentic security).

---

## Guide 1: The Shorthand Guide — Foundation Setup

### Skills & Commands
- Skills are the **primary workflow surface** — scoped workflow bundles with reusable prompts, structure, supporting files, and codemaps
- Commands are legacy slash-entry compatibility shims; durable logic should live in skills
- Skills live in `~/.claude/skills/`, commands in `~/.claude/commands/`

### Hooks (Trigger-Based Automations)
Six hook types: PreToolUse, PostToolUse, UserPromptSubmit, Stop, PreCompact, Notification
- **PreToolUse**: Before tool executes (validation, reminders)
- **PostToolUse**: After tool finishes (formatting, feedback loops)
- **Stop**: When Claude finishes responding
- **PreCompact**: Before context compaction

### Subagents
- Processes the orchestrator delegates tasks to with limited scopes
- Can run in background or foreground, freeing up context
- Configure allowed tools, MCPs, and permissions per subagent
- Live in `~/.claude/agents/`

### Rules & Memory
- Two approaches: single CLAUDE.md or modular rules folder (`~/.claude/rules/`)
- Example rules: no emojis, no console.logs, always test before deploy

### MCPs (Model Context Protocol)
- **CRITICAL: Context Window Management** — keep under 10 enabled / under 80 tools active
- 20-30 MCPs in config is fine, but disable everything unused
- 200k context window can drop to 70k with too many tools enabled

### Plugins
- Package tools for easy installation (skill + MCP combined, or hooks/tools bundled)
- LSP Plugins: TypeScript, Python type checking without needing an IDE

### Key Tips
- `Ctrl+U` delete line, `!` bash prefix, `@` search files, `/` slash commands
- **Fork** conversations for parallel non-overlapping tasks
- **Git Worktrees** for overlapping parallel Claudes without conflicts
- **tmux** for long-running commands
- **mgrep** > grep — ~50% token reduction vs traditional grep/ripgrep
- `/rewind`, `/statusline`, `/checkpoints`, `/compact`

### affaan's Personal Setup
- **Plugins (4-5 enabled at a time):** ralph-wiggum, frontend-patterns, commit-commands, security-guidance, pr-review-toolkit, typescript-lsp, hookify, code-simplifier, feature-dev, code-review, context7, pyright-lsp, mgrep
- **MCPs (14 configured, ~5-6 enabled per project):** GitHub, Firecrawl, Supabase, memory, sequential-thinking, Vercel, Railway, Cloudflare, ClickHouse, AbletonMCP, Magic UI
- **Key Hooks:** tmux reminder before long commands, prettier on edit, tsc --noEmit on TS edit, console.log warning, git push opens editor for review
- **Rules:** security, coding-style, testing, git-workflow, agents, patterns, performance, hooks
- **Subagents:** planner, architect, tdd-guide, code-reviewer, security-reviewer, build-error-resolver, e2e-runner, refactor-cleaner, doc-updater

---

## Guide 2: The Longform Guide — Advanced Patterns

### Context & Memory Management
- **Session persistence:** Skill/command that summarizes progress, saves to `.tmp` file in `.claude` folder, appends until session end. Next day uses that as context.
- Session files should contain: what worked (with evidence), what didn't work, what hasn't been attempted
- **Clear context strategically** — once plan is set, clear exploration context that's no longer relevant
- **Disable auto-compact**, manually compact at logical intervals

### Dynamic System Prompt Injection
```bash
claude --system-prompt "$(cat memory.md)"
```
System prompt content has higher authority than user messages, which have higher authority than tool results.

### Memory Persistence Hooks (Undocumented)
- **PreCompact Hook**: Save important state before compaction
- **Stop Hook (Session End)**: Persist learnings to file
- **SessionStart Hook**: Load previous context automatically
- **Why Stop hook (not UserPromptSubmit):** Stop runs once at session end — lightweight. UserPromptSubmit runs on every message — adds latency.

### Continuous Learning
- When Claude discovers a non-trivial pattern (debugging technique, workaround, project-specific pattern), save it as a new skill
- Next time similar problem comes up, skill loads automatically
- Implemented as a Stop hook (not UserPromptSubmit) to avoid per-message latency

### Token Optimization
**Primary Strategy: Subagent Architecture** — delegate cheapest possible model sufficient for the task.

| Task Type | Model | Why |
|-----------|-------|-----|
| Exploration/search | Haiku | Fast, cheap, good enough |
| Simple edits | Haiku | Single-file, clear instructions |
| Multi-file implementation | Sonnet | Best balance for coding |
| Complex architecture | Opus | Deep reasoning needed |
| PR reviews | Sonnet | Context + nuance |
| Security analysis | Opus | Can't miss vulnerabilities |
| Writing docs | Haiku | Structure is simple |
| Debugging complex bugs | Opus | Needs entire system in mind |

Default to Sonnet for 90% of coding. Upgrade to Opus when first attempt failed, task spans 5+ files, architectural decisions, or security-critical code.

**MCPs are replaceable** — CLIs wrapped in skills/commands can replace MCPs, saving context window tokens. Example: `/gh-pr` command instead of GitHub MCP.

**Modular codebase** — files in hundreds of lines instead of thousands helps token optimization and first-attempt correctness.

### Verification Loops & Evals
- **Checkpoint-Based Evals**: Set explicit checkpoints, verify against criteria, fix before proceeding
- **Continuous Evals**: Run every N minutes or after major changes
- **pass@k**: At least ONE of k attempts succeeds (k=1: 70%, k=3: 91%, k=5: 97%)
- **pass^k**: ALL k attempts must succeed (k=1: 70%, k=3: 34%, k=5: 17%)

### Parallelization
- **Cascade Method**: Open new tasks in new tabs to the right, sweep left to right (oldest to newest), focus on at most 3-4 tasks
- **Two-Instance Kickoff Pattern**: Instance 1 = Scaffolding (project structure, configs), Instance 2 = Deep Research (PRD, architecture diagrams, references)
- **Git Worktrees** for overlapping parallel instances
- **Goal**: Maximum done with minimum viable parallelization

### Sub-Agent Context Problem
- Sub-agents save context by returning summaries, but orchestrator has semantic context the sub-agent lacks
- **Iterative Retrieval Pattern**: Orchestrator evaluates every return, asks follow-ups, sub-agent goes back to source, loops until sufficient (max 3 cycles)
- **Key:** Pass objective context, not just the query

### Sequential Phase Pattern
```
Phase 1: RESEARCH (Explore agent) → research-summary.md
Phase 2: PLAN (planner agent) → plan.md
Phase 3: IMPLEMENT (tdd-guide agent) → code changes
Phase 4: REVIEW (code-reviewer agent) → review-comments.md
Phase 5: VERIFY (build-error-resolver) → done or loop back
```
Rules: One clear input/output per agent, outputs become inputs for next phase, never skip phases, use `/clear` between agents, store intermediates in files.

---

## Guide 3: The Security Guide — Agentic Security

### The Threat Landscape
- **CVE-2025-59536 (CVSS 8.7)**: Claude Code project-contained code could run before trust dialog accepted
- **CVE-2026-21852**: Attacker-controlled project could override `ANTHROPIC_BASE_URL`, redirect API traffic, leak API key
- **MCP consent abuse**: Repo-controlled MCP config could auto-approve project MCP servers before trust
- **Snyk ToxicSkills**: 3,984 public skills scanned, 36% had prompt injection, 1,467 malicious payloads
- **Microsoft AI Recommendation Poisoning**: 31 companies, 14 industries — memory-oriented attacks
- **Unit 42**: Web-based indirect prompt injection observed in the wild (March 2026)
- **Hunt.io**: 17,470 exposed OpenClaw-family instances

### Attack Vectors
- **WhatsApp/Email**: Attacker sends prompt injection via message or PDF attachment; agent reads it as instruction
- **GitHub PR reviews**: Malicious instructions in hidden diff comments, issue bodies, linked docs, tool output
- **MCP servers**: Can be vulnerable by accident, malicious by design, or over-trusted
- **Simon Willison's Lethal Trifecta**: Private data + untrusted content + external communication in same runtime

### Sandboxing
- **Separate identity first**: agent@yourdomain.com, separate bot user, short-lived scoped tokens
- **Run untrusted work in isolation**: containers, devcontainers, VMs, remote sandboxes
- **Docker Compose with `internal: true`** — no egress by default
- **Restrict tools and paths**: deny rules for `~/.ssh/`, `~/.aws/`, `.env*`, `curl | bash`, `ssh`, `scp`, `nc`

### Sanitization
- Everything an LLM reads is executable context — no distinction between "data" and "instructions"
- **Hidden Unicode**: zero-width spaces, bidi override characters, HTML comments, buried base64
- **Sanitize attachments**: extract only needed text, strip comments/metadata, keep extraction separate from action-taking agent
- **Sanitize linked content**: inline external docs or add guardrails next to links

### Approval Boundaries / Least Agency
- The safety boundary is the **policy between the model and the action**, not the system prompt
- Require approval for: unsandboxed shell, network egress, secret-bearing paths, off-repo writes, workflow dispatch/deployment
- **Least agency** — only give the agent minimum room to maneuver

### Observability / Logging
- Log: tool name, input summary, files touched, approval decisions, network attempts, session/task ID
- Structured logs enable anomaly detection
- Wire into OpenTelemetry at scale

### Kill Switches
- Kill the **process group**, not just the parent (children can keep running)
- `SIGTERM` for graceful, `SIGKILL` for immediate
- **Heartbeat-based dead-man switch**: supervisor kills process group if heartbeat stalls (30s interval)
- Stalled tasks get quarantined for log review

### Memory as Attack Surface
- Persistent memory is "gasoline" — payload doesn't have to win in one shot, can plant fragments and assemble later
- Don't store secrets in memory files
- Separate project memory from user-global memory
- Reset/rotate memory after untrusted runs
- Disable long-lived memory for high-risk workflows

### Minimum Bar Checklist
1. Separate agent identities from personal accounts
2. Use short-lived scoped credentials
3. Run untrusted work in containers/devcontainers/VMs/sandboxes
4. Deny outbound network by default
5. Restrict reads from secret-bearing paths
6. Sanitize files, HTML, screenshots, linked content before privileged agent sees them
7. Require approval for unsandboxed shell, egress, deployment, off-repo writes
8. Log tool calls, approvals, network attempts
9. Implement process-group kill and heartbeat dead-man switches
10. Keep persistent memory narrow and disposable
11. Scan skills, hooks, MCP configs, agent descriptors like supply chain artifacts

### Core Rule
> **Never let the convenience layer outrun the isolation layer.**

---

## Relevance to OpenCode Hubs

1. **Skills as primary surface** — OpenCode's skill system aligns with ECC's philosophy; commands are legacy shims
2. **Hook architecture** — OpenCode's plugin hook system (PreToolUse, PostToolUse, Stop, etc.) mirrors ECC's approach
3. **Subagent pattern** — ECC's iterative retrieval pattern (orchestrator evaluates, asks follow-ups, loops) is directly applicable to OpenCode's subagent delegation
4. **Token optimization** — Model selection tiers (Haiku/Sonnet/Opus) map to OpenCode's model tiering (Fast/Mid/Top)
5. **Context management** — Session persistence via `.tmp` files, strategic clearing, PreCompact/Stop hooks for memory
6. **Security** — ECC's security guide is the most comprehensive agentic security resource available; directly applicable to OpenCode's security rules and AgentShield integration
7. **ECC repo structure** — 67 agents, 271 skills, 92 commands, cross-harness support (Claude Code, Codex, Cursor, OpenCode, Gemini, Zed, Copilot) — a reference architecture for OpenCode Hubs

---

## References

1. ECC Repository: https://github.com/affaan-m/ECC
2. Shorthand Guide: https://x.com/affaan/status/2012378465664745795
3. Longform Guide: https://x.com/affaan/status/2014040193557471352
4. Security Guide: https://x.com/affaan/status/2033263813387223421
5. AgentShield: https://github.com/affaan-m/agentshield
6. Check Point Research (Feb 2026): https://research.checkpoint.com/2026/rce-and-api-token-exfiltration-through-claude-code-project-files-cve-2025-59536/
7. Snyk ToxicSkills: https://snyk.io/blog/toxicskills-malicious-ai-agent-skills-clawhub/
8. Unit 42 Indirect Prompt Injection: https://unit42.paloaltonetworks.com/ai-agent-prompt-injection/
9. Microsoft AI Recommendation Poisoning: https://www.microsoft.com/en-us/security/blog/2026/02/10/ai-recommendation-poisoning/
