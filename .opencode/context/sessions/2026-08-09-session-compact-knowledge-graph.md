---
title: "Session Compact — 2026-08-09: Knowledge Graph + Self-Improvement Loop"
type: synthesis
tags: [session-compact, knowledge-graph, hybrid-retrieval, self-improvement, graph-context, tui-menu]
created: 2026-08-09
updated: 2026-08-09
sources: [graph-context, self-improvement, hub-menu-rebuild]
status: active
---

# Session Compact — 2026-08-09

Compacted summary of session `ses_02e087a55ffe6ukLpbPyqbtfo3` (Aug 7–9, 2026). Full
deliverables, decisions, and next steps for resuming work.

## What Was Built

| Deliverable | Location | Notes |
|-------------|----------|-------|
| **graph-context skill** | `skills/graph-context/` | sqlite graph store (`graphlib.mjs`, 715 lines) + CLI (`graph.mjs`: build/query/neighbors/impact/path/stats/probe) + SKILL.md |
| **Hybrid retrieval** | `graphlib.mjs queryHybrid` | vector recall → BFS graph refine (depth ≤ 2, decay 0.6) → graph-title fallback recall for config-asset queries |
| **`/project graph`** | `tools/hubs/project/graph.ts` | registered, spec-registry rebuilt, routing row + AGENTS.md updated |
| **self-improvement loop** | `skills/self-improvement/SKILL.md` | capture → triage → promote; learnings at `.opencode/context/learnings/`; wired to `graph build` after capture |
| **`/project self-improve`** | `tools/hubs/project/self-improve.ts` | capture/triage/promote subcommand |
| **`/ideation improvements`** | `tools/hubs/ideation/improvements.ts` | 4-phase audit with approve/deny gate |
| **Insights/delegate/session-memory** | `skills/{insights,opencode-delegate,session-memory}/` | prior deliverables committed in same batch |

## Key Decisions

1. **Knowledge graph stores beside vector store** — `.opencode/state/vector/graph.db` (gitignored, ephemeral, per-project).
2. **Node id convention** — `{type}:{slug-or-path}`; skill nodes keyed by skill directory name (NOT path) so registry `used_by` edges resolve.
3. **Markdown is canonical** — graph is derived; backfill is idempotent + mtime-lazy.
4. **Graph-title fallback recall** — vector store only covers the wiki, so config-asset queries ("git commit") returned nothing; token-scored title/path matching over graph nodes rescues them.
5. **`relatedSkills:` frontmatter** — now parsed into `related_to` edges; 7 skills tagged (graph densification: 171 related_to edges).
6. **Rule added: hub-menu-rebuild** — TUI menus are generated (`plugins/hubs-tui/`), NOT live from manifests. New subcommands are invisible until `bun run generate-menus && bun build` runs. See `rules/hub-menu-rebuild.md`.

## Validation Results

| Metric | Value |
|--------|-------|
| Graph | 388 nodes (188 hub-subcommands, 123 skills), 263 edges, 260 tags |
| Precision probe | hybrid **8/10**, vector-only 5/10 — **+60% hit rate**, gate (>20%) passed |
| Example | "knowledge graph" → vector: no results; hybrid: graph-context + graph-thinking + opencode-manifold |
| Commits | `8d50525` (feature), `79280b0` (TUI menu fix) |
| OpenCode reload | required to see `/project graph` in TUI |

## Follow-ups (Deferred)

- Telemetry `tool.error` capture in hook (`plugins/hooks/telemetry.ts`)
- consolidate-telemetry triage/metric thresholds
- Workflow-asset gates in `/project retrospect`
- si6 principles into `skills/self-improve/SKILL.md`
- Provision archetypes: run `graph build` post-harvest in new projects
- GitHub dependabot: 11 vulns (2 critical, 4 high) on repo

## Related

- [[vectorize-context]] — sibling vector store (`veclib.mjs`; graphlib imports `queryChunks` from it)
- [[graph-context]] — the skill this page documents (via `skills/graph-context/SKILL.md`)
- [[self-improvement]] — capture loop feeding `learning` nodes + `touches` edges
- `rules/hub-menu-rebuild.md` — TUI regeneration rule
