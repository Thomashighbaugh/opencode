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
    ├── resource-hub/      # 18
    ├── memory-hub/        # 13
    ├── research-hub/      # 14
    ├── design-hub/        #  7
    ├── ideate-hub/        # 17
    ├── plan-hub/          # 16
    ├── verify-hub/        # 14
    ├── swarm-hub/         # 17
    ├── build-hub/         # 14
    ├── orchestrate-hub/   # 12
    ├── git-hub/           # 10
    ├── maintain-hub/      #  9
```

## Legacy Routing

`LEGACY_ROUTE_MAP` in `tools/hub-data.ts` maps the pre-split `oldHub/oldSub` keys onto their current
`newHub/newSub` home, so `/project commit` still resolves to `/git-hub commit`. Retired with no
redirect: `project/pt-review`, `project/pt-audit`, `project/pt-debt`, `project/pt-gain` (ponytail
pattern) and `orchestrate/deep` (duplicate of `ideation/deep-dive`).

The 2026-10 re-homing pass moved subcommands to the hub that owns their activity (e.g. `journal` →
`orchestrate-hub`, `sweep` → `maintain-hub`, `tracer` → `verify-hub`, `scan` renamed `sec-scan`).
A later 2026-10 pass moved the architecture cluster (`arch-prep`, `architecture`, `modularity`) out
of `design-hub` — where "design" ambiguously spanned visual UI/UX and project architecture — into
`build-hub`, alongside `refactor`/`modernize`/`overhaul`.
Every vacated `<hub>/<sub>` key was added to `LEGACY_ROUTE_MAP`, so a saved `/memory-hub resume`
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
| `ideate-hub` | `adversarial-debate` | inline |
| `ideate-hub` | `brainstorm` | inline |
| `ideate-hub` | `cleanroom` | inline |
| `ideate-hub` | `ddd` | inline |
| `ideate-hub` | `deep-dive` | deep-dive |
| `ideate-hub` | `deep-thinker` | deep-thinker |
| `ideate-hub` | `double-diamond` | inline |
| `ideate-hub` | `event-storming` | inline |
| `ideate-hub` | `grill` | grilling |
| `ideate-hub` | `interview` | deep-interview |
| `ideate-hub` | `opro` | opro |
| `ideate-hub` | `pwf` | inline |
| `ideate-hub` | `refine` | idea-refine |
| `ideate-hub` | `resume` | inline |
| `ideate-hub` | `rpikit` | inline |
| `ideate-hub` | `spark` | inline |
| `ideate-hub` | `tree-of-thoughts` | tree-of-thoughts |
| `maintain-hub` | `converge` | inline |
| `maintain-hub` | `insights` | insights |
| `maintain-hub` | `organize` | file-organizer |
| `maintain-hub` | `purge` | inline |
| `maintain-hub` | `retrospect` | inline |
| `maintain-hub` | `sandbox` | inline |
| `maintain-hub` | `self-improve` | self-improvement |
| `maintain-hub` | `sweep` | inline |
| `maintain-hub` | `workspace` | inline |
| `memory-hub` | `capture` | remember |
| `memory-hub` | `compress` | inline |
| `memory-hub` | `consolidate-telemetry` | inline |
| `memory-hub` | `consume` | inline |
| `memory-hub` | `context` | inline |
| `memory-hub` | `diff` | inline |
| `memory-hub` | `export` | inline |
| `memory-hub` | `memory` | remember |
| `memory-hub` | `prune` | inline |
| `memory-hub` | `search` | inline |
| `memory-hub` | `secondbrain` | inline |
| `memory-hub` | `session` | inline |
| `memory-hub` | `vectorize` | inline |
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
| `plan-hub` | `bottom-up` | inline |
| `plan-hub` | `constitution` | inline |
| `plan-hub` | `decomposition` | inline |
| `plan-hub` | `effort-estimator` | @effort-estimator |
| `plan-hub` | `impact-mapping` | inline |
| `plan-hub` | `improvements` | inline |
| `plan-hub` | `jtbd` | inline |
| `plan-hub` | `lean-canvas` | inline |
| `plan-hub` | `plan-execute` | plan-execute |
| `plan-hub` | `plan` | plan |
| `plan-hub` | `ralplan` | ralplan |
| `plan-hub` | `requirements-analyzer` | @requirements-analyzer |
| `plan-hub` | `spiral` | inline |
| `plan-hub` | `status` | inline |
| `plan-hub` | `story-mapping` | inline |
| `plan-hub` | `top-down` | inline |
| `research-hub` | `analyst` | @analyst |
| `research-hub` | `analyze-patterns` | inline |
| `research-hub` | `compare` | inline |
| `research-hub` | `competitive-analysis` | inline |
| `research-hub` | `convention-extractor` | @convention-extractor |
| `research-hub` | `deep-research` | deep-research |
| `research-hub` | `document-specialist` | @document-specialist |
| `research-hub` | `explore` | @explore |
| `research-hub` | `extract-standards` | code-standards-extractor |
| `research-hub` | `library-docs` | inline |
| `research-hub` | `scientist` | @scientist |
| `research-hub` | `sciomc` | sciomc |
| `research-hub` | `tech-eval` | inline |
| `research-hub` | `web-research` | inline |
| `resource-hub` | `add` | inline |
| `resource-hub` | `config-orchestrator` | @config-orchestrator |
| `resource-hub` | `create` | inline |
| `resource-hub` | `edit` | inline |
| `resource-hub` | `find` | inline |
| `resource-hub` | `graph` | graph-thinking |
| `resource-hub` | `info` | inline |
| `resource-hub` | `knowledge-graph` | graph-context |
| `resource-hub` | `list` | inline |
| `resource-hub` | `package` | inline |
| `resource-hub` | `prompt-simplifier` | @prompt-simplifier |
| `resource-hub` | `remove` | inline |
| `resource-hub` | `scan` | inline |
| `resource-hub` | `search` | inline |
| `resource-hub` | `setup` | inline |
| `resource-hub` | `sync` | inline |
| `resource-hub` | `update` | inline |
| `resource-hub` | `validate` | inline |
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
| `swarm-hub` | `cc10x` | inline |
| `swarm-hub` | `delegate` | opencode-delegate |
| `swarm-hub` | `devin` | inline |
| `swarm-hub` | `gastown` | inline |
| `swarm-hub` | `gsd` | inline |
| `swarm-hub` | `harden` | harden |
| `swarm-hub` | `hive-plan` | inline |
| `swarm-hub` | `hive` | hive-methodology |
| `swarm-hub` | `maestro` | inline |
| `swarm-hub` | `metaswarm` | inline |
| `swarm-hub` | `pair` | inline |
| `swarm-hub` | `react` | inline |
| `swarm-hub` | `remediate` | inline |
| `swarm-hub` | `ruflo` | inline |
| `swarm-hub` | `self-assess` | self-improve |
| `swarm-hub` | `spec-driven` | inline |
| `swarm-hub` | `subagent-driven` | subagent-driven-development |
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
