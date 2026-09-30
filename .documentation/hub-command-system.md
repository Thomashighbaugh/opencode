# Hub Command System

14 topical hubs, 183 subcommands, two-tier routing. `/hub-setup` is the project-config front door; it absorbed `/scaffold-hub`, and `/init-project` before that, without changing a single subcommand. A command system built to spend **one LLM
round-trip instead of two**, and to stay unambiguous in a flat dialog.

---

## The hubs

| Hub | Subcommands | Purpose |
| --- | ----------: | ------- |
| `scaffold-hub`   | 12 | Detect the stack, provision project config, health checks |
| `resource-hub`   | 12 | Find and vet agents, skills, rules, tools, connectors |
| `memory-hub`     | 18 | Durable context — capture, retrieve, curate, compound |
| `research-hub`   | 13 | Research, analysis, pattern extraction, tracing |
| `design-hub`     |  9 | Architecture, design, docs, READMEs |
| `ideate-hub`     | 16 | Brainstorm, grill, DDD, MOC, tree-of-thoughts |
| `plan-hub`       | 16 | Requirements, decomposition, constitution, plans |
| `verify-hub`     | 11 | Review, audit, TDD, security, debugging |
| `swarm-hub`      | 17 | Multi-agent patterns — hive, pair, swarm, consensus |
| `build-hub`      | 12 | Implement, refactor, simplify, modernize, pipeline |
| `orchestrate-hub`| 12 | Long-running modes — ralph, autopilot, consensus |
| `git-hub`        | 10 | Commits, PRs, releases, changelog |
| `maintain-hub`   | 12 | Retrospectives, health, workspace, convergence |
| `skills-hub`     | 13 | Create, validate, package, sync skills |

The 2026-09-28 split moved every menu to a `-hub` suffix. Legacy names (`/orchestration`,
`/ideation`, `/project`) still resolve through `LEGACY_ROUTE_MAP` in `tools/hub-data.ts`, so old
invocations keep working.

---

## Two-tier routing

This is the efficiency mechanism.

### Direct selection — `/orchestrate-hub ralph`

`hubMenu` with `action: "route"` returns the **full spec** for exactly that subcommand in a single
response: `detailedDescription`, inlined rule content, related-skill pointers, examples, warnings.

```
/orchestrate-hub ralph ──▶ ONE response with everything
```

### Hub + intent — `/orchestrate-hub` then a natural-language request

```bash
hubMenu({ action: "menu" })
```

returns only the **identity slice** — `label` + short `description` + reminder — for the whole
hub. The model picks one, then a second `route` call loads the full spec.

```
/orchestrate-hub ──▶ slim list ──▶ model chooses ──▶ route ──▶ full spec
```

**Nothing is loaded that is not used.** A 17-subcommand hub presented as 17 full specs would
spend context on 16 subcommands the user did not ask for.

> The `menu` action itself is now discouraged in favour of listing subcommands as plain text,
> which saves a round-trip entirely.

---

## The spec model

Every subcommand is a `HubSubcommandSpec` in `tools/hubs/<hub>/<subcommand>.ts`:

| Field                | Purpose |
| -------------------- | ------- |
| `label`              | Display name — **must be unique within its hub** |
| `description`        | ≤ 80 characters, self-contained, no hub name |
| `detailedDescription`| The full payload, no length limit |
| `reminder`           | One-line invocation hint |
| `tools` / `rules`    | What the subcommand is allowed to use |
| `relatedSkills`      | Skills to load on demand |
| `skill` / `agent`    | Delegation target |
| `examples` / `warnings` | Usage and hazards |

A spec may reference skills, agents, commands, and rules. `tests/global/delegation.test.ts`
(184 tests) validates that **every reference resolves to a file that exists**. Four broken
references were found this way and fixed.

---

## Registry generation

```
tools/hubs/<hub>/<subcommand>.ts      ← canonical source
        │
        │  npx tsx tools/build-spec-registry.ts
        ▼
tools/hubs/spec-registry.json          ← consumed by hubMenu + graph
        │
        │  cd plugins/hubs-tui && bun run generate-menus
        ▼
plugins/hubs-tui/src/generated-hubs.ts ← committed
```

A subcommand is invisible to the user until **both** regenerations run.
See [TUI Plugin](plugins-hubs-tui.md).

---

## Label uniqueness

Two collisions were found by the suite and fixed:

| Hub            | Collision                                            | Fix |
| -------------- | ---------------------------------------------------- | --- |
| `memory-hub`   | `capture` and `context` both labelled `context`        | `capture` |
| `swarm-hub`    | `hive` and `hive-plan` both labelled `hive`            | `hive-plan` |

In a flat dialog, two subcommands with the same label make the choice unactionable — the user
cannot tell which one they are picking, and the routed payload is arbitrary. Labels are now
asserted unique per hub.

---

## Hub → graph

Every registered subcommand becomes a `hub-subcommand` node, with `used_by` edges to the skill or
agent it delegates to.

Those edges were dead for a long time: 26 of them pointed at `agent:@executor` while the graph had
**zero agent nodes**, and once agents were indexed they were keyed by path
(`agent:agents/executor`) rather than by the bare name the registry uses. The edges existed and
carried no information, so "which agent handles `/build-hub executor`" was unanswerable while the
graph looked complete.

`backfillFromRegistry` now writes those edges only when the target node exists, and reports
`skippedTargets` rather than emitting a dangling edge.

→ [Knowledge Plane](knowledge-plane.md) covers the invariants.

---

## Where hubs hand off

Hubs do not auto-chain. A `/ideate-hub brainstorm` result does not silently become a
`/plan-hub plan`. Cross-hub hand-off is manual by design: the user decides which phase comes next,
because an agent that advances its own workflow removes the human from the loop between deciding
what to build and building it.

`rules/completion-guardrail.md` enforces the same boundary at the model level.

---

## Interdependencies

| This system uses | From |
| ---------------- | ---- |
| Generated menu bundle | [TUI Plugin](plugins-hubs-tui.md) |
| `used_by` edges and the subcommand schema | [Knowledge Plane](knowledge-plane.md) |
| Delegation targets | [Orchestration](subagent-orchestration.md) |
| Skills the subcommands reference | [Rules & Skills](rules-and-skills.md) |
| `gen-routing-docs` regenerates `rules/hub-routing.md` | [`tools/`](../tools/) |

→ Next: [Rules & Skills](rules-and-skills.md)
