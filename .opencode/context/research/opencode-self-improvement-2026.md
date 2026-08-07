---
title: "OpenCode Self-Improvement: Methodologies and Mechanisms (2026)"
type: source-summary
tags: [opencode, self-improvement, rsi, skillforge, curator, skillinjector, autoresearch, reflexion, memory, rule-promotion, learning-loop, benchmark, graduation]
created: 2026-08-07
updated: 2026-08-07
sources: [github, skillsmp, gist, opencode.ai, arxiv, nousresearch, deepwiki]
status: active
---

# OpenCode Self-Improvement: Methodologies and Mechanisms

Multi-source research synthesis (August 2026) on how OpenCode — the terminal AI coding agent — is extended with self-improvement capabilities: plugins, skills, workflows, and memory systems that make the agent measurably better over time.

## 1. Taxonomy of OpenCode Self-Improvement Approaches

| Approach | Mechanism | OpenCode surface | Evidence model |
|----------|-----------|------------------|----------------|
| **Skill lifecycle loop** (SkillForge/Curator/SkillInjector) | Post-turn pattern extraction → skill creation; periodic curation; pre-turn injection | Plugins (`before_agent_start`, `agent_end` hooks), `.opencode/skills/` | Heuristic 4-dim rubric scoring |
| **Benchmark-driven optimization** (autoresearch) | Modify code → run benchmark → keep/discard → repeat; auto-compaction, git isolation | Plugin tools + `/autoresearch` command | MAD-based statistical confidence |
| **Config/rules evolution** (evolve) | Capture → queue → lint → promote → measure pipeline over session history | Skills, `~/.config/opencode/` | Reflexion-style rule_id recurrence tracking |
| **Evidence-gated prompt engineering** (agent-self-improvement workflow) | Gate failures → log to MEMORY.md → periodic review → prompt change with rationale → measure | Workflow, `agents/`, MEMORY.md | Logged evidence per change, recurrence measurement |
| **Memory blocks** (Letta-style) | Persistent self-editable memory, journal, system-prompt injection | Plugins (opencode-agent-memory, hindsight) | Shared markdown state |
| **Bounded self-improvement harness** (learning-guard) | Improver agent, guarded `oc_learning_*` write tools, toolset narrowing | Agents, skills, plugin | Validation + backups + path confinement |

## 2. Mechanism 1: Skill Lifecycle Loop (Hermes-style) — `Svtter/opencode-self-improve`

Three-component autonomous learning loop inside OpenCode, modeled on [Hermes Agent](https://github.com/NousResearch/hermes-agent):

1. **SkillForge** (review fork, fires on `agent_end`) — extracts patterns from conversations and creates/updates structured skills
2. **Curator** (background timer, configurable interval) — re-scores all skills, removes low-quality, merges duplicates
3. **SkillInjector** (fires on `before_agent_start`) — injects relevant skills into the system prompt so the agent benefits from accumulated knowledge

**Scoring rubric** (4 dimensions, weighted):
- accuracy 0.3, completeness 0.25, actionability 0.25, uniqueness 0.2
- `minQualityScore: 0.5` retention floor, `mergeThreshold: 0.85` duplicate merge

**Storage**: SQLite (`~/local/share/opencode-self-improve/skills.db`) + YAML files in `~/.opencode/skills/`. Registered commands: `/skill-status`, `/skill-review`, `/skill-diff`. Config: `maxSkillsPerTurn: 1`, `minTurnsBeforeReview: 5`, `autoCreate/autoUpdate` toggles.

**vs Hermes Agent**: standalone runtime → OpenCode plugin; LLM-based scoring → heuristic rubric; 7-day fixed cycle → configurable interval; built-in memory → complements Magic Context.

## 3. Mechanism 2: Benchmark-Driven Optimization — `mittalsuraj18/opencode-auto-research`

OpenCode-native port of [Karpathy's autoresearch](https://github.com/karpathy/autoresearch) pattern (83K+ stars):

1. **Benchmark harness** (`autoresearch.sh`) measures target metrics
2. **Experiment loop** — modify code, run benchmark, evaluate, keep or discard
3. **Auto-compaction** — context compacted after every iteration to prevent overflow
4. **Git integration** — commits on keep, resets on discard, dedicated branches
5. **Scope enforcement** — `scope_paths` / `off_limits` restrict which files the agent can modify
6. **Confidence scoring** — MAD (Median Absolute Deviation)-based statistical confidence; low confidence → improvement may be measurement noise, revert to baseline

**Protocol**: structured `METRIC`/`ASI` parsing (not raw output reading). **Persistence**: SQLite `~/.opencode-autoresearch/<encoded-path>.db` (sessions/runs tables) + git + `autoresearch.md` in project root.

**vs karpathy/autoresearch**: manual git → automatic commit/reset; context degradation → auto-compaction with state preservation; raw metric parsing → structured protocol; single-file convention → explicit scope; manual thresholds → MAD confidence; git-log-only → SQLite+git+markdown.

**Command**: `/autoresearch optimize compile time` — resumes active experiments, creates benchmark harness if missing, runs baseline.

## 4. Mechanism 3: Config/Rules Evolution — `twidxuga` evolve skill v2

A **capture → queue → lint → promote → measure** pipeline that improves the opencode agent configuration from real session data. Distinctly OpenCode-config-focused (analyzes session history, `~/.config/opencode/`):

1. **Capture** — candidates from session history: tool-failure mining, repeated-question detection, runtime-discovery extraction, keyword detection
2. **Queue** — candidates go to a queue first; promotion is a separate, **evidence-gated** step (v2 change from v1)
3. **Lint** — sensitivity classification via maintained term list + regex pack (not hardcoded grep)
4. **Promote** — high-confidence candidates become rules; **scoring includes reversibility, effort, blast radius**
5. **Measure (Reflexion loop)** — every promoted rule gets a `rule_id`; symptom recurrence tracked in sessions AFTER the `created` timestamp; rule citations counted. Events: `validated` (recurrence ≤1 AND citations >0), `cited`, `recurrence_detected`. No-impact rules get **demoted back to queue**

**Privacy**: Phase 0 privacy regression check; **dual logs** — generic to public, full to private (`~/.config/opencode/` may be a public GitHub repo).

## 5. Mechanism 4: Evidence-Gated Prompt Engineering — `rajibmahata` agent-self-improvement workflow

Deliberate, reviewable prompt improvement — "not agents editing themselves unsupervised":

1. **Log inline** — any agent hitting a gate failure (Architecture/Code/Security/Performance/QA/Docs review) or debugger root-cause asks: *one-off mistake, or would a clearer instruction in the agent's prompt file have prevented it?* If the latter, logs one line to root `MEMORY.md` Agent Improvement Log (which agent, what kept going wrong, evidence)
2. **Periodic review** — Prompt Engineer reviews accumulated entries (end of phase / before release)
3. **Draft prompt change** — for real patterns (same gap >1 failure), with documented rationale (before/after/motivating entries)
4. **Architect review** — required if the change alters an agent's *mandate*, not just execution detail
5. **Apply + clear** — resolved entries cleared, noting date and file changed

**Guardrails**: never bypasses quality gates; incremental `memory_str_replace`-style edits (one section at a time), never full rewrites; security findings go through `security-review.md` first. **Completion criteria**: every change traces to logged evidence; same-class gate failure measurably decreases or the change is revisited.

## 6. Mechanism 5: Memory Blocks & Persistent Memory

- **`opencode-agent-memory`** (joshuadavidthomas, Letta-inspired, 322⭐): persistent self-editable memory blocks — shared markdown files every session reads/writes; global blocks across projects, project blocks across sessions; system-prompt injection (always in-context); append-only **journal with semantic search**. "AGENTS.md with a harness." Requires OpenCode v1.0.115+. Seeded blocks: `persona` (global), `human` (global, user preferences)
- **`@vectorize-io/opencode-hindsight`** (Hindsight, SOTA memory paper arXiv:2512.12818): three tools (retain, recall, reflect) + auto hooks — recall on start, retain on idle, preserve through compaction; bank-ID memory scoping; non-blocking graceful degradation; cloud or self-hosted
- **MCP-based memory** (Kronvex et al.): dynamic evolving knowledge alongside static AGENTS.md

## 7. Mechanism 6: Guarded Self-Improvement Harness — `Tah10n/opencode-harness`

**Controlled, bounded** self-improvement with separation of responsibilities:

- `global-memory` (skills/global-memory/SKILL.md) — "what durable fact should future runs remember?"
- `global-self-improvement` (skills/global-self-improvement/SKILL.md) — "should this verified experience become memory or a reusable skill?"
- `agents/improver.md` — the only agent allowed to write learning artifacts
- `opencode-learning-guard` plugin — enforces validation, capacity, path confinement, backups, managed-skill boundaries; **`oc_learning_*` tools: `deny` at root, `ask` only on improver**

**Toolset narrowing**: `memory-read`, `memory-write`, `skills-write`, `improver`, `none`; `enabledTools` allow-list for narrower mixes.

**Persistence rules**: persist only durable preferences, stable environment facts, reusable workflow lessons, compact redacted lessons from repeated verified failures. **Never persist**: secrets/credentials, raw logs/stack traces, one-off task facts, unverified guesses, anything weakening safety policy. Cleanup is **audit-first** (`oc_learning_memory_audit` before remove/replace; backups before writes).

**Flow**: after verified non-trivial work → load global-self-improvement → decide durable/verified/non-sensitive/reusable → memory vs managed skill (prefer patching existing over near-duplicate) → write via `oc_learning_*` only → verify effective loaded surface. **Must not mutate** product code, AGENTS.md, opencode.json, agent definitions, plugins, bundled or project-local skills unless explicitly asked.

## 8. Supporting Theory & Related Patterns

- **Reflexion loop** (gnuos roadmap, 2026-03): execute → evaluate → reflect → retry; reflection-plugin.ts capturing task/attempt/output/error/critique/improvement, persisted to `.opencode/reflections/YYYYMMDD.json` on `session.idle`. 5-stage evolution roadmap: reflection layer → memory/experience → code self-modification → multi-agent collaboration → meta-learning (SEAL)
- **OpenCode extensibility surfaces** (the substrate all mechanisms build on): event hooks (`session.idle`, `session.created`, `session.error`, `tool.execute.before/after`, `file.edited`, `message.updated`, `permission.replied`), custom tools, middleware, state management
- **different-ai agent-bank** (self-bootstrapping workspace, 230⭐): self-aware/self-building/self-improving/self-fixing/reconstructable principles; `skill-reinforcement` skill triggers post-use: analyze what worked → identify new patterns → update skill file → prevent knowledge loss between sessions
- **Agentic Context Engineering** (arXiv 2603.05344): models evolve their own contexts through self-improvement loops; **Mentorship-as-Code**: review feedback becomes version-controlled, testable MentorScript rules enabling cumulative improvement
- **RSI survey** (arXiv 2607.07663): Good's "intelligence explosion" + Schmidhuber's Gödel machines = theoretical endpoint; fragments now engineering practice (FunSearch, AlphaEvolve)

## 9. Synthesis: Convergent Design Principles for OpenCode Self-Improvement

Across all six mechanisms, the ecosystem converges on:

1. **Evidence-gating before promotion** — nothing becomes durable (skill, rule, memory, prompt change) without logged evidence: rubric scores (SkillForge), MAD confidence (autoresearch), rule_id recurrence (evolve), logged gate findings (rajibmahata)
2. **Queues separate capture from promotion** (evolve v2) — candidates accumulate; promotion is a distinct, linted, high-confidence step
3. **Asymmetric removal** — demotion/revert is cheaper than promotion (demote to queue, git reset on discard, quality floor removal); being wrong about improvement is acceptable, persisting wrongness is not
4. **Injection at the right point** — learned knowledge enters the system prompt (SkillInjector, memory blocks) or the rule surface (evolve) so it shapes behavior, not just context
5. **Guardrails are structural, not advisory** — tool permissions (`oc_learning_*` deny/ask), scope enforcement, path confinement, backups, mandatory quality gates
6. **Measurement closes the loop** — recurrence tracking (Reflexion), benchmark deltas, citation counts; improvements that don't measurably reduce symptom recurrence get revisited
7. **Separation of concerns** — memory vs skills vs prompts vs code; different authorities for each (improver agent, Prompt Engineer, Solution Architect)
8. **Manual by default, autonomous by graduation** — the general 2026 pattern (see [[agentic-self-improvement-2026]]): confidence accrues, autonomy grows

## Evidence Sources

- Svtter — [opencode-self-improve (SkillForge/Curator/SkillInjector)](https://github.com/Svtter/opencode-self-improve)
- mittalsuraj18 — [opencode-auto-research](https://github.com/mittalsuraj18/opencode-auto-research)
- different-ai — [agent-bank self-improve skill](https://github.com/different-ai/agent-bank/tree/main/.opencode/skill/self-improve)
- twidxuga — [dotfiles evolve skill v2](https://skillsmp.com/creators/twidxuga/dotfiles/opencode-dot-config-opencode-skills-evolve)
- rajibmahata — [agent-self-improvement workflow](https://github.com/rajibmahata/opencode/blob/main/workflows/agent-self-improvement.md)
- Tah10n — [opencode-harness memory-and-self-improvement](https://github.com/Tah10n/opencode-harness/blob/main/docs/memory-and-self-improvement.md)
- gnuos — [OpenCode CLI Self-Improvement roadmap gist](https://gist.github.com/gnuos/710b13bf201f8cceed56f1aaaab10ef7)
- joshuadavidthomas — [opencode-agent-memory](https://github.com/joshuadavidthomas/opencode-agent-memory)
- Hindsight — [OpenCode persistent memory](https://hindsight.vectorize.io/blog/2026/04/20/opencode-persistent-memory)
- [Building Effective AI Coding Agents for the Terminal (arXiv:2603.05344)](https://arxiv.org/html/2603.05344v2)
- [Recursive Self-Improvement in AI (arXiv:2607.07663)](https://arxiv.org/html/2607.07663v1)
- [ICLR 2026 Workshop on AI with RSI](https://iclr.cc/virtual/2026/workshop/10000796)

## Cross-References

- [[agentic-self-improvement-2026]] — general RSI survey (this report is the opencode-specific complement)
- [[recursive-self-improvement]] — confidence-scored graduation case study
- [[short-leash-ai-method-okturtles]] — constrained AI execution patterns
- [[opencode-dispatcher]] — permission model patterns
- [[observational-memory-mastra]] — agent memory frameworks
