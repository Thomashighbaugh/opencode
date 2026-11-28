---
name: hub-routing
description: Hub routing model and the menu-to-subcommand delegation table.
---

# Hub Routing Model

> Regenerate with `npx tsx tools/gen-routing-docs.ts` (NOTE: that generator is currently broken
> on this Node/toolchain — `ERR_PACKAGE_PATH_NOT_EXPORTED` for `@opencode-ai/plugin`; this file
> was updated by hand to match.)

## How Routing Works

The hub routing system has two modes, chosen based on whether the user has already specified a subcommand:

### 1. Direct Selection (no routing needed)

When the user invokes a hub WITH a subcommand — e.g. `/orchestrate-hub ralph` or `/git-hub commit` — routing is already done. The `hubMenu` tool's `route` action loads ONLY that one subcommand's full spec from `tools/hubs/<hub>/<subcommand>.ts` and returns it in a single response:

- `detailedDescription` — the exhaustive pattern/action explanation (1-3 paragraphs)
- `tools` — which tools the subcommand uses
- `rulesContent` — rule files inlined into the response (no follow-up reads needed)
- `relatedSkillMeta` — pointers to related skills (name, path, description)
- `examples` — non-obvious usage examples
- `warnings` — cost/risk warnings

This eliminates the follow-up `loadSkill` and rule-read calls that the old model required. The model gets everything in one tool response.

### 2. Routing Required (bare hub or natural language)

When the user invokes a a bare hub command (`/orchestrate-hub` with a natural-language task) or uses pure natural language with no command, routing IS needed. In this case, the `menu` action returns the slim subcommand list (label + short description + reminder only — no `detailedDescription`). The model picks the right subcommand from the slim list, then calls `route` to get the full spec.

### What the Slim Menu Contains

Each hub manifest (`tools/hub-<name>.ts`) imports only the identity slice from `tools/hubs/<name>/index.ts`:
- `label` — the subcommand name
- `description` — short description for the model's routing view
- `reminder` — terse reminder for the TUI menu UI
- delegation pointer (`skill` / `agent` / `command` / `inline`)

The full `detailedDescription`, `tools`, `rules`, `relatedSkills`, `examples`, and `warnings` stay in the per-subcommand spec files and are only loaded on direct selection.

## File Layout

```
tools/
├── hubMenu.ts              # Hub menu router tool
├── hub-data.ts             # Types, loaders, HUB_FILE_MAP, SUBCOMMAND_DIR_MAP, LEGACY_ROUTE_MAP
├── hub-<name>-hub.ts       # Thin manifest (13 files) — identity slice only
└── hubs/
    ├── hub-setup/      # 12 files + index.ts
    ├── hub-setup/      # 18
    ├── knowledge-hub/        # 13
    ├── research-hub/      # 14
    ├── design-hub/        #  7
    ├── think-hub/        # 17
    ├── think-hub/          # 16
    ├── verify-hub/        # 14
    ├── orchestrate-hub/         # 17
    ├── build-hub/         # 14
    ├── orchestrate-hub/   # 12
    ├── git-hub/           # 10
    ├── verify-hub/      #  9
```

## Legacy Routing

`LEGACY_ROUTE_MAP` in `tools/hub-data.ts` maps the pre-split `oldHub/oldSub` keys onto their current
`newHub/newSub` home, so `/project commit` still resolves to `/git-hub commit`. Retired with no
redirect: `project/pt-review`, `project/pt-audit`, `project/pt-debt`, `project/pt-gain` (ponytail
pattern) and `orchestrate/deep` (duplicate of `ideation/deep-dive`).

The 2026-10 re-homing pass moved subcommands to the hub that owns their activity (e.g. `journal` →
`orchestrate-hub`, `sweep` → `verify-hub`, `tracer` → `verify-hub`, `scan` renamed `sec-scan`).
A later 2026-10 pass moved the architecture cluster (`arch-prep`, `architecture`, `modularity`) out
of `design-hub` — where "design" ambiguously spanned visual UI/UX and project architecture — into
`build-hub`, alongside `refactor`/`modernize`/`overhaul`.
Every vacated `<hub>/<sub>` key was added to `LEGACY_ROUTE_MAP`, so a saved `/knowledge-hub resume`
prompt still resolves.

## Delegation Table (173 subcommands)

| Menu | Subcommand | Delegation |
|------|-----------|------------|
| `build-hub` | `arch-prep` | architect |
| `build-hub` | `architecture` | improve-codebase-architecture |
| `build-hub` | `brownfield` | brownfield |
| `build-hub` | `cleanup` | ai-slop-cleaner |
| `build-hub` | `executor` | @executor |
| `build-hub` | `modernize` | code-simplification |
| `build-hub` | `modularity` | architect |
| `build-hub` | `optimize` | inline |
| `build-hub` | `overhaul` | overhaul |
| `build-hub` | `pipeline` | inline |
| `build-hub` | `refactor` | code-simplification |
| `build-hub` | `simplify-code` | code-simplification |
| `build-hub` | `simplify` | code-simplification |
| `build-hub` | `vibe-code` | vibe-code |
| `design-hub` | `designer` | @designer |
| `design-hub` | `docs` | deepinit |
| `design-hub` | `frontend-design` | @frontend-design |
| `design-hub` | `icon` | icon-generator |
| `design-hub` | `readme` | readme-updater |
| `design-hub` | `redesign` | redesign-existing-projects |
| `design-hub` | `writer` | @writer |
| `git-hub` | `archive` | inline |
| `git-hub` | `changelog` | changelog-generator |
| `git-hub` | `commit-drafter` | @commit-drafter |
| `git-hub` | `commit` | conventional-commit |
| `git-hub` | `gh` | github-ops |
| `git-hub` | `git-cleanup` | inline |
| `git-hub` | `git-master` | @git-master |
| `git-hub` | `git-stage-thread` | inline |
| `git-hub` | `pr` | github-ops |
| `git-hub` | `release` | inline |
| `think-hub` | `adversarial-debate` | inline |
| `think-hub` | `brainstorm` | inline |
| `think-hub` | `cleanroom` | inline |
| `think-hub` | `ddd` | inline |
| `think-hub` | `deep-dive` | deep-dive |
| `think-hub` | `deep-thinker` | deep-thinker |
| `think-hub` | `double-diamond` | inline |
| `think-hub` | `event-storming` | inline |
| `think-hub` | `grill` | grilling |
| `think-hub` | `interview` | deep-interview |
| `think-hub` | `opro` | opro |
| `think-hub` | `pwf` | inline |
| `think-hub` | `refine` | idea-refine |
| `think-hub` | `resume` | inline |
| `think-hub` | `rpikit` | inline |
| `think-hub` | `spark` | inline |
| `think-hub` | `tree-of-thoughts` | tree-of-thoughts |
| `verify-hub` | `converge` | inline |
| `verify-hub` | `insights` | insights |
| `verify-hub` | `organize` | file-organizer |
| `verify-hub` | `purge` | inline |
| `verify-hub` | `retrospect` | inline |
| `verify-hub` | `sandbox` | inline |
| `verify-hub` | `self-improve` | self-improvement |
| `verify-hub` | `sweep` | inline |
| `verify-hub` | `workspace` | inline |
| `knowledge-hub` | `capture` | remember |
| `knowledge-hub` | `compress` | inline |
| `knowledge-hub` | `consolidate-telemetry` | inline |
| `knowledge-hub` | `consume` | inline |
| `knowledge-hub` | `context` | inline |
| `knowledge-hub` | `diff` | inline |
| `knowledge-hub` | `export` | inline |
| `knowledge-hub` | `memory` | remember |
| `knowledge-hub` | `prune` | inline |
| `knowledge-hub` | `search` | inline |
| `knowledge-hub` | `secondbrain` | inline |
| `knowledge-hub` | `session` | inline |
| `knowledge-hub` | `vectorize` | inline |
| `orchestrate-hub` | `autopilot` | autopilot |
| `orchestrate-hub` | `ccg` | ccg |
| `orchestrate-hub` | `consensus` | inline |
| `orchestrate-hub` | `evolutionary` | inline |
| `orchestrate-hub` | `journal` | inline |
| `orchestrate-hub` | `ralph` | ralph |
| `orchestrate-hub` | `resume` | inline |
| `orchestrate-hub` | `state-machine` | inline |
| `orchestrate-hub` | `status` | inline |
| `orchestrate-hub` | `swarm` | swarm |
| `orchestrate-hub` | `team` | team |
| `orchestrate-hub` | `ultrawork` | ultrawork |
| `think-hub` | `bottom-up` | inline |
| `think-hub` | `constitution` | inline |
| `think-hub` | `decomposition` | inline |
| `think-hub` | `effort-estimator` | @effort-estimator |
| `think-hub` | `impact-mapping` | inline |
| `think-hub` | `improvements` | inline |
| `think-hub` | `jtbd` | inline |
| `think-hub` | `lean-canvas` | inline |
| `think-hub` | `plan-execute` | plan-execute |
| `think-hub` | `plan` | plan |
| `think-hub` | `ralplan` | ralplan |
| `think-hub` | `requirements-analyzer` | @requirements-analyzer |
| `think-hub` | `spiral` | inline |
| `think-hub` | `status` | inline |
| `think-hub` | `story-mapping` | inline |
| `think-hub` | `top-down` | inline |
| `research-hub` | `analyst` | @analyst |
| `research-hub` | `analyze-patterns` | inline |
| `research-hub` | `compare` | inline |
| `research-hub` | `competitive-analysis` | inline |
| `research-hub` | `convention-extractor` | @convention-extractor |
| `research-hub` | `document-specialist` | @document-specialist |
| `research-hub` | `explore` | @explore |
| `research-hub` | `extract-standards` | code-standards-extractor |
| `research-hub` | `library-docs` | inline |
| `research-hub` | `research` | inline |
| `research-hub` | `scientist` | @scientist |
| `research-hub` | `sciomc` | sciomc |
| `research-hub` | `tech-eval` | inline |
| `research-hub` | `web-research` | inline |
| `hub-setup` | `add` | inline |
| `hub-setup` | `config-orchestrator` | @config-orchestrator |
| `hub-setup` | `create` | inline |
| `hub-setup` | `edit` | inline |
| `hub-setup` | `find` | inline |
| `hub-setup` | `graph` | graph-thinking |
| `hub-setup` | `info` | inline |
| `hub-setup` | `knowledge-graph` | graph-context |
| `hub-setup` | `list` | inline |
| `hub-setup` | `package` | inline |
| `hub-setup` | `prompt-simplifier` | @prompt-simplifier |
| `hub-setup` | `remove` | inline |
| `hub-setup` | `scan` | inline |
| `hub-setup` | `search` | inline |
| `hub-setup` | `setup` | inline |
| `hub-setup` | `sync` | inline |
| `hub-setup` | `update` | inline |
| `hub-setup` | `validate` | inline |
| `hub-setup` | `config` | opencode-configure |
| `hub-setup` | `detect` | stack-detector |
| `hub-setup` | `doctor` | inline |
| `hub-setup` | `map-codebase` | inline |
| `hub-setup` | `provision` | project-config-composer |
| `hub-setup` | `recommend` | stack-recommender |
| `hub-setup` | `refresh` | init-project |
| `hub-setup` | `reset` | inline |
| `hub-setup` | `setup` | init-project |
| `hub-setup` | `status` | inline |
| `hub-setup` | `tag` | tag-resources |
| `hub-setup` | `verify` | verify |
| `orchestrate-hub` | `cc10x` | inline |
| `orchestrate-hub` | `delegate` | opencode-delegate |
| `orchestrate-hub` | `devin` | inline |
| `orchestrate-hub` | `gastown` | inline |
| `orchestrate-hub` | `gsd` | inline |
| `orchestrate-hub` | `harden` | harden |
| `orchestrate-hub` | `hive-plan` | inline |
| `orchestrate-hub` | `hive` | hive-methodology |
| `orchestrate-hub` | `maestro` | inline |
| `orchestrate-hub` | `metaswarm` | inline |
| `orchestrate-hub` | `pair` | inline |
| `orchestrate-hub` | `react` | inline |
| `orchestrate-hub` | `remediate` | inline |
| `orchestrate-hub` | `ruflo` | inline |
| `orchestrate-hub` | `self-assess` | self-improve |
| `orchestrate-hub` | `spec-driven` | inline |
| `orchestrate-hub` | `subagent-driven` | subagent-driven-development |
| `verify-hub` | `audit` | inline |
| `verify-hub` | `code-review` | code-reviewer |
| `verify-hub` | `create-tests` | inline |
| `verify-hub` | `critic` | @critic |
| `verify-hub` | `debugger` | @debugger |
| `verify-hub` | `deep-bug-hunt` | inline |
| `verify-hub` | `qa-tester` | @qa-tester |
| `verify-hub` | `quality` | inline |
| `verify-hub` | `review` | inline |
| `verify-hub` | `sec-scan` | inline |
| `verify-hub` | `security-reviewer` | @security-reviewer |
| `verify-hub` | `tdd` | inline |
| `verify-hub` | `test-engineer` | @test-engineer |
| `verify-hub` | `tracer` | @tracer |
