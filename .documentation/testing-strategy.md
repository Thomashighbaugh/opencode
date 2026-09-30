# Testing Strategy

**990 tests. Not one of them asserts that source text contains a substring.**

That is the whole strategy. Most defects in an agent harness are silent no-ops, and a source-text
assertion passes happily against code that never runs:

| Assertion                                        | What it misses                                              |
| ------------------------------------------------ | ----------------------------------------------------------- |
| `expect(src).toContain('overrideGlobal')`       | A `overrideGlobal` that is parsed and never applied          |
| `expect(src).toMatch(/insertEdge\(fileNode/)`\)  | An `insertEdge` the backfill never reaches                   |
| `expect(elapsed).toBeLessThan(1000)`             | Whether the cache works, or how busy the machine is          |
| `expect(spec.description.length).toBeLessThan(90)` | Whether the description is *useful*                        |

Every test here observes an effect.

---

## The suites

| Suite                            | Tests | Protects |
| -------------------------------- | ----: | -------- |
| `agent-format.test.ts`           |   280 | Agent definition structure, frontmatter, delegation targets |
| `file-integrity.test.ts`         |   243 | Referenced files exist; no orphan assets                     |
| `delegation.test.ts`             |   184 | Every skill/agent/command/rule reference resolves           |
| `command-hooks.test.ts`          |   106 | The full declarative-hook surface, driven end to end        |
| `feature-package.test.ts`        |    86 | Config schema, hub specs, labels, descriptions, rules       |
| `knowledge-plane.test.ts`        |    26 | Graph and vector invariants, live SQL                       |
| `efficiency-token.test.ts`       |    23 | Prompt budgets, reminder size, retrieval ordering           |
| `efficiency-request.test.ts`     |    14 | Cache substitution, invalidation, child reuse, injection    |
| `schema.test.ts`                 |    10 | `opencode.jsonc` conforms to the live schema                |

Plus two `node --test` suites against the vector kernel: `veclib.test.ts` (30) and `cli.test.ts`
(34).

```bash
bun run test:run                              # 990
npx tsc --noEmit -p tsconfig.json             # config + plugins
npx tsc --noEmit -p skills/tsconfig.json      # skills
```

---

## Test levels

### Behavioural — drive the runtime

`createHandlers` is the same function the plugin calls, so tests fire real events and observe
real side effects: what a command printed, what exited non-zero, what got injected, and what did
not.

### Database-level — invariants as queries

Not regexes over source, but SQL over a live graph:

```sql
-- no edge points at a node that does not exist
-- no node is edgeless
-- every file is part_of a module
-- every declaration is defines-linked to its file
```

### Adversarial — assert the negative

The strongest tests assert something is **not** happening:

- Injection makes **zero** `promptAsync` calls.
- A node does **not** get skipped when a `toolArgs` filter names a key the call did not provide.
- `session.idle` does **not** fire for a child session.
- A broken project config does **not** disable the global one.
- A malformed regex does **not** throw at match time — it is rejected at load.

### Regeneration — idempotence is a property

A settled graph rebuild must report `structure unchanged` and zero changed files, and must
produce a byte-identical edge set. A derivation-rule change must **invalidate** it, which is what
`DERIVATION_EPOCH` guarantees.

---

## Bugs this suite found

Not theoretical. These were real, in this repository.

### Product defects

| Defect | Why it was invisible |
| ------ | -------------------- |
| After-hook dedupe set its timestamp *then* compared it | Delta always 0, so **every after-hook was silently dropped** |
| Tool-cache invalidation keyed on a bare hash | Prefix search could never match a hex string — every invalidation a no-op |
| `nodeId` stripped `.opencode/` from file ids | `.opencode/tools/x.ts` collided with `tools/x.ts`; no graph↔store join worked |
| Structure signature ignored derivation rules | Editing how edges are derived left the signature unchanged, so the rebuild skipped |
| `class K` rejected before opening a scope | Every method inside a short-named class recorded `parent: null` |
| `session.start` alias resolved at one call site | The documented spelling never fired |
| Override suppression compared one-way | A global hook on `*` was unreplaceable |
| Agent frontmatter missing on 4 skills | Configured, delegated to by hub commands, and unreachable |
| `generateCommandHooks` hand-escaped JSON | Emitted **invalid JSON** into every provisioned project |
| Root-level files had no `part_of` | 5 nodes one edge short of an invariant, reachable only by accident |
| 88 + 26 dangling graph edges | SQLite enforces no foreign keys; the graph reported 18k edges and lied |

### Scanner defects — text that was not what it looked like

| Input                                   | Why it was scraped as a link |
| --------------------------------------- | ---------------------------- |
| `[[ ! -f ~/.psm/projects.json ]]`       | bash double-bracket tests share the `[[ ]]` syntax |
| `](https://github.com/…/SKILL.md)`      | an external URL ending in `.md` matched the markdown-link branch |
| `` `[[page-slug]]` `` in `wiki-schema.md` | the schema documenting its own syntax |
| `relatedSkills: rsi, wiki`              | a comma-separated scalar pushed as one name |
| A `(` in prose paired with a `.md` below | the link regex spanned newlines |

Of the 205 "broken wiki links", only **36** were actually missing pages.

### Test defects — the tests were lying

Worth listing, because a test that fails for the wrong reason is worse than no test.

| Defect | How it was caught |
| ------ | ----------------- |
| `expect(elapsed).toBeLessThan(1000)` | Failed at 4031 ms under full-suite load, passed 3/3 alone — it measured the machine |
| Asserting on every `/tmp` directory | An unrelated killed run left orphans and the test blamed the code |
| A test that contradicted the alias fix | Caught while fixing `session.start`; the test encoded the bug |
| A source regex for a graph invariant | Broke when the call was reformatted while the invariant still held |
| Missing `overrideGlobal` in a fixture | Failed only after the product code was fixed correctly |
| A `describe`-body call using a `beforeEach` value | `undefined` at collection time |

**The rule that emerged: if a test fails intermittently, fix the test.** Re-running until green
teaches nothing and ships a race.

---

## Invariants the suite enforces permanently

These are not tests that were written once; they are properties the system cannot lose.

| Invariant | Enforced by |
| --------- | ----------- |
| No model is pinned in config, agent frontmatter, or a profile | `schema.test.ts`, `agent-format.test.ts` |
| Every skill/agent/rule/command reference resolves to a real file | `delegation.test.ts` |
| No on-demand rule lacks a referrer | `feature-package.test.ts` |
| No subcommand description exceeds 80 chars or names its hub | `feature-package.test.ts` |
| No duplicate subcommand label within a hub | `feature-package.test.ts` |
| Every wiki link in the context tree resolves | `knowledge-plane.test.ts` |
| No dangling edge, no edgeless node, no `part_of`-less file | `knowledge-plane.test.ts` |
| A settled rebuild does zero work and preserves the graph exactly | `knowledge-plane.test.ts` |
| Injection costs zero inference requests | `efficiency-request.test.ts` |
| A settled graph rebuild is free; a derivation change is not skippable | `knowledge-plane.test.ts` |
| The code layer has 0 TypeScript errors | `skills/tsconfig.json` |

---

## Conventions

- **`tests/global/`** — config, plugins, knowledge plane, skills, agents.
- **`skills/vectorize-context/tests/`** — the vector kernel, under `node --test`, with a mock
  embedding server so the suite needs no live model.
- **Real commands, not mocked ones.** A shell hook test runs `echo`, captures stdout, and asserts
  on the exit code.
- **The first version of a test is often wrong.** Two suites here were rewritten after they
  proved they were measuring the wrong thing.

---

## Why it matters

An agent harness fails quietly. It returns plausible output from a broken cache, a dangling edge,
and an unreachable skill. The only defence is a suite that observes effects and fails when they
stop — which is what the 990 tests are for.

→ [Architecture](architecture.md) · [Back to README](../README.md)
