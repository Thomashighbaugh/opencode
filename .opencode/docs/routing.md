# Hub Routing Model

> Auto-generated from `tools/hubMenu.ts` + `tools/hub-data.ts` + `tools/hubs/`.
> Run `npx tsx tools/gen-routing-docs.ts` to regenerate.

## How Routing Works

The hub routing system has two modes, chosen based on whether the user has already specified a subcommand:

### 1. Direct Selection (no routing needed)

When the user invokes a hub WITH a subcommand — e.g. `/orchestrate ralph` or `/project commit` — routing is already done. The `hubMenu` tool's `route` action loads ONLY that one subcommand's full spec from `tools/hubs/<hub>/<subcommand>.ts` and returns it in a single response:

- `detailedDescription` — the exhaustive pattern/action explanation (1-3 paragraphs)
- `tools` — which tools the subcommand uses
- `rulesContent` — rule files inlined into the response (no follow-up reads needed)
- `relatedSkillMeta` — pointers to related skills (name, path, description)
- `examples` — non-obvious usage examples
- `warnings` — cost/risk warnings

This eliminates the follow-up `loadSkill` and rule-read calls that the old model required. The model gets everything in one tool response.

### 2. Routing Required (bare hub or natural language)

When the user invokes a bare hub command (`/orchestrate` with a natural-language task) or uses pure natural language with no command, routing IS needed. In this case, the `menu` action returns the slim subcommand list (label + short description + reminder only — no `detailedDescription`). The model picks the right subcommand from the slim list, then calls `route` to get the full spec.

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
├── hub-data.ts             # Types, loaders (loadHub, loadSubcommandSpec, loadSubcommandSpecFull)
├── hub-<name>.ts           # Thin manifest (10 lines each) — identity slice only
└── hubs/
    ├── orchestrate/
    │   ├── index.ts         # Re-exports all specs + identity slice
    │   ├── ralph.ts         # Full HubSubcommandSpec
    │   ├── team.ts
    │   └── ... (33 files)
    ├── ideation/            # 38 files
    ├── harvest-context/     # 21 files
    ├── init-project/        # 17 files
    ├── project/             # 26 files
    └── skills/              # 13 files
```

## Delegation Table (148 subcommands)

| Hub | Subcommand | Delegation | Target |
|-----|-----------|------------|--------|
| init-project | setup | skill | init-project |
| init-project | detect | agent | stack-detector |
| init-project | recommend | skill | stack-recommender |
| init-project | docs | skill | deepinit |
| init-project | context | skill | remember |
| init-project | verify | agent | verifier |
| init-project | refresh | skill | init-project |
| init-project | status | inline | true |
| init-project | map-codebase | inline | true |
| init-project | doctor | inline | true |
| init-project | reset | inline | true |
| init-project | provision | skill | project-config-composer |
| init-project | tag | skill | tag-resources |
| init-project | find-skills | skill | find-skills |
| init-project | find-agents | skill | find-agents |
| init-project | find-tools | skill | find-tools |
| init-project | find-rules | skill | find-rules |
| ideation | plan | skill | plan |
| ideation | brainstorm | inline | true |
| ideation | decomposition | inline | true |
| ideation | refine | skill | idea-refine |
| ideation | overhaul | skill | overhaul |
| ideation | deep | skill | deep-interview |
| ideation | graph | skill | graph-thinking |
| ideation | research | skill | ccg |
| ideation | ralplan | skill | ralplan |
| ideation | ddd | inline | true |
| ideation | event-storming | inline | true |
| ideation | double-diamond | inline | true |
| ideation | jtbd | inline | true |
| ideation | impact-mapping | inline | true |
| ideation | spiral | inline | true |
| ideation | top-down | inline | true |
| ideation | bottom-up | inline | true |
| ideation | adversarial-debate | inline | true |
| ideation | cleanroom | inline | true |
| ideation | pwf | inline | true |
| ideation | rpikit | inline | true |
| ideation | hive | inline | true |
| ideation | story-mapping | inline | true |
| ideation | lean-canvas | inline | true |
| ideation | constitution | inline | true |
| ideation | quality | inline | true |
| ideation | architecture | skill | improve-codebase-architecture |
| ideation | redesign | skill | redesign-existing-projects |
| ideation | grill | skill | grilling |
| ideation | modularity | agent | architect |
| ideation | arch-prep | agent | architect |
| ideation | web-research | inline | true |
| ideation | tech-eval | inline | true |
| ideation | competitive-analysis | inline | true |
| ideation | tree-of-thoughts | skill | tree-of-thoughts |
| ideation | opro | skill | opro |
| ideation | resume | inline | true |
| ideation | status | inline | true |
| orchestrate | ralph | skill | ralph |
| orchestrate | team | skill | team |
| orchestrate | deep | skill | deep-dive |
| orchestrate | ccg | skill | ccg |
| orchestrate | ultrawork | skill | ultrawork |
| orchestrate | autopilot | skill | autopilot |
| orchestrate | sciomc | skill | sciomc |
| orchestrate | swarm | skill | swarm |
| orchestrate | state-machine | inline | true |
| orchestrate | consensus | inline | true |
| orchestrate | evolutionary | inline | true |
| orchestrate | spec-driven | inline | true |
| orchestrate | react | inline | true |
| orchestrate | plan-execute | skill | plan-execute |
| orchestrate | hive | skill | hive-methodology |
| orchestrate | tdd | inline | true |
| orchestrate | pair | inline | true |
| orchestrate | pipeline | inline | true |
| orchestrate | gsd | inline | true |
| orchestrate | self-assess | skill | self-improve |
| orchestrate | remediate | inline | true |
| orchestrate | devin | inline | true |
| orchestrate | maestro | inline | true |
| orchestrate | metaswarm | inline | true |
| orchestrate | cc10x | inline | true |
| orchestrate | gastown | inline | true |
| orchestrate | ruflo | inline | true |
| orchestrate | harden | skill | harden |
| orchestrate | subagent-driven | skill | subagent-driven-development |
| orchestrate | brownfield | skill | brownfield |
| orchestrate | vibe-code | skill | vibe-code |
| orchestrate | resume | inline | true |
| orchestrate | status | inline | true |
| harvest-context | session | inline | true |
| harvest-context | codebase | skill | deepinit |
| harvest-context | skill | skill | skill-creator |
| harvest-context | agent | skill | opencode-agent-creator |
| harvest-context | rule | inline | true |
| harvest-context | command | skill | opencode-command-creator |
| harvest-context | memory | skill | remember |
| harvest-context | docs | inline | true |
| harvest-context | web-research | inline | true |
| harvest-context | compare | inline | true |
| harvest-context | decompose | agent | planner |
| harvest-context | context | inline | true |
| harvest-context | consume | inline | true |
| harvest-context | compress | inline | true |
| harvest-context | secondbrain | inline | true |
| harvest-context | journal | inline | true |
| harvest-context | search | inline | true |
| harvest-context | prune | inline | true |
| harvest-context | export | inline | true |
| harvest-context | diff | inline | true |
| harvest-context | sweep | inline | true |
| project | tests | command | create-tests |
| project | commit | skill | conventional-commit |
| project | stage | command | git-stage-thread |
| project | pr | command | pr |
| project | gh | skill | github-ops |
| project | optimize | command | optimize |
| project | refactor | agent | refactoring |
| project | simplify | agent | code-simplifier |
| project | cleanup | skill | ai-slop-cleaner |
| project | modernize | agent | refactoring |
| project | icon | skill | icon-generator |
| project | organize | skill | file-organizer |
| project | analyze | command | analyze-patterns |
| project | changelog | skill | changelog-generator |
| project | converge | inline | true |
| project | scan | inline | true |
| project | sandbox | inline | true |
| project | retrospect | inline | true |
| project | purge | inline | true |
| project | release | inline | true |
| project | review | inline | true |
| project | audit | inline | true |
| project | archive | inline | true |
| project | git-cleanup | inline | true |
| project | workspace | inline | true |
| project | readme | skill | readme-updater |
| skills | list | inline | true |
| skills | add | inline | true |
| skills | create | skill | skill-creator |
| skills | remove | inline | true |
| skills | edit | inline | true |
| skills | search | inline | true |
| skills | info | inline | true |
| skills | update | inline | true |
| skills | package | inline | true |
| skills | validate | inline | true |
| skills | sync | inline | true |
| skills | setup | inline | true |
| skills | scan | inline | true |