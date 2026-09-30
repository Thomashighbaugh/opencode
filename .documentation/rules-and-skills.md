# Rules, Skills, and Tools

The content layer: what the agent is told, what it can load on demand, and what it can call.

| Asset  | Count | Loaded                                                        |
| ------ | ----: | ------------------------------------------------------------- |
| Rules  |    20 | 11 at startup · 9 on demand                                   |
| Skills |   125 | On demand, by name or auto-trigger                            |
| Tools  |    46 | Discovered from `tools/` at startup                            |

---

## Rules

### The startup set (11)

Listed in `opencode.jsonc` → `instructions`, so they are in context on every turn:

| Rule | Purpose |
| ---- | ------- |
| `AGENTS.md` | The project's own instructions — the root document |
| `shell_strategy.md` | Non-interactive shell discipline; prevents hangs |
| `context-strategy.md` | State vs context; manual-only context operations |
| `karpathy-guidelines.md` | Think first, simplicity, surgical changes |
| `file-operations.md` | Artifact placement; no root-level scripts |
| `security.md` | Mandatory checks, secret handling |
| `hub-description-directive.md` | Subcommand description conventions |
| `completion-guardrail.md` | Mandatory stop between planning and implementation |
| `output-compression.md` | Output shape — table > bullets > prose |
| `anti-sycophancy.md` | No reflexive agreement |
| `efficiency-first.md` | **The standing constraint** — request and token budgets |
| `hub-menu-rebuild.md` | Regenerate the TUI after hub changes |

These are not advice. They encode the failure modes this configuration has actually had:
non-interactive shells that hang on a prompt, scripts written to the project root, a model that
plans and then implements without a human in between.

### The on-demand set (9)

Not in `instructions` — five more files on every turn is a permanent cost for content only some
workflows need. They are reachable because the skills and agents that need them name them.

| Rule | Referenced by |
| ---- | ------------- |
| `coding-style.md` | `code-standards-extractor`, `rule-generator` |
| `git-workflow.md` | `conventional-commit`, `github-ops`, `git-master` agent |
| `performance.md` | `insights`, `scientist` agent |
| `testing.md` | `tdd`, `test-coverage-improver` |
| `global-reference.md` `hub-routing.md` `hub-state.md` `resource-tags.md` | hub specs and each other |

**A rule with no referrer is a dead file.** Five were: present, referenced by nothing, therefore
loaded by nothing, while `rules/AGENTS.md` presented them as active.

- Four now have real referrers.
- `core-behavior.md` was **deleted** — it restated rules already in `instructions`
  (`karpathy-guidelines`, `efficiency-first`, `output-compression`). Referencing it would have
  created a fourth, divergent copy of rules that already load. A duplicate is worse than an
  absence.

A test now fails if any on-demand rule loses its referrer.

---

## Skills

A skill is a markdown document with YAML frontmatter, loadable on demand:

```markdown
---
name: tdd
description: Test-driven development loop — red-green-refactor until covered.
---
```

125 skills across functional categories — Init, Ideation, Orchestration, Harvest, UX, External,
Meta, QA, Docs.

### Frontmatter is not cosmetic

A skill without valid frontmatter is **invisible to the loader**. Four were broken that way, one
of which (`init-project`) is delegated to by four hub subcommands — configured, wired, and
unreachable.

| Defect | Consequence |
| ------ | ----------- |
| Missing frontmatter entirely | invisible to the loader |
| `name: omc-plan` vs directory `plan` | name/directory mismatch |
| Display title as `name` | invalid identifier |

All three are now asserted in `tests/global/feature-package.test.ts`.

Four legacy skills are deliberately **frontmatter-less** — `harvest-context`, `ideation`,
`orchestrate`, `project` — superseded by the `-hub` menus. They are recorded as a known set.
Adding frontmatter to them would advertise them permanently for no benefit.

### Skills can carry hooks

A subagent's own `SKILL.md`-style frontmatter (in `agents/*.md`) can declare `hooks:` that run
only for that agent. See [Command Hooks](plugins-command-hooks.md).

---

## Tools

46 TypeScript tools in `tools/`, auto-discovered at startup. **11,785 LOC.**

### File editing

| Tool | Purpose |
| ---- | ------- |
| `regex-edit` | Replace, insert, delete by pattern or line range |
| `json-edit` | JSON/JSONC by JSONPath (RFC 9535) |
| `yaml-edit` | YAML by dot-path |
| `conf-edit` | `.env`, INI, key=value |
| `multi-edit` | Batch across files by glob |

`rules/file-operations.md` exists because inline `python3 -c` / `sed -i` editing was the norm, and
it fails silently on quoting, has no preview, and leaves no trace. These tools do it properly, and
every one supports a dry run.

### Context and state

`agentContext` · `modeState` · `taskTodos` · `artifacts` · `agent-cache` · `semantic-cache` ·
`scope-context` · `getSessionID`

### Knowledge

`graphQuery` — `query` · `neighbors` · `impact` · `path` · `build` · `stats`
See [Knowledge Plane](knowledge-plane.md).

### Hubs

`hubMenu` plus one manifest per hub (`tools/hub-<name>.ts`).
See [Hub Command System](hub-command-system.md).

### Caching

`cache` and `cache-utils` implement a multi-tier prompt cache: `tool` (15m), `mcp` (7d), `llm`
(1h), `agent` (30m), `session` (24h, memory), `stable` (24h), `context7` (7d), `file` (24h,
memory).

---

## MCP servers

Five, configured in `opencode.jsonc`:

| Server | Purpose |
| ------ | ------- |
| `context7` | Current library documentation |
| `grep_app` | Literal code search across public GitHub |
| `searxng` | Self-hosted metasearch, the default web engine |
| filesystem / filesystem-remote | Sandboxed file access |
| `sequential-thinking` | Structured reasoning |

---

## Interdependencies

| These assets use | From |
| ---------------- | ---- |
| `queueContextMessage` for auto-loading | [Event Interception](plugins-hooks.md) |
| `context7-docs` caching into the namespace cache | [Efficiency](request-token-efficiency.md) |
| Rule and skill frontmatter parsed by the same YAML path | [Command Hooks](plugins-command-hooks.md) |
| All of them indexed as graph nodes | [Knowledge Plane](knowledge-plane.md) |

→ Next: [Efficiency](request-token-efficiency.md)
