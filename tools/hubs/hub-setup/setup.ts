import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_LOADSKILL_LISTAGENTS_BASH_MODESTATE, SKILLS_SETUP_REFRESH } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "setup",
  description: "Full 9-phase project setup — detect, provision, document, verify",
  reminder: "Full init. Asks: standard, full, or minimal scope.",
  skill: "init-project",
  phases: "0-8",

  detailedDescription: `Full project initialization pipeline. On first run (no mode flag) it gates on a single question — **standard, full, or minimal?** — then runs the matching phase set.

**Standard**: 7 phases run (0-5, 8). Lightweight setup that detects the stack, provisions project-specific resources, generates documentation, and verifies everything works.

**Full**: All 9 phases run (0-8). Adds deep codebase mapping with parallel agents, context synthesis, agent upgrade with deep project knowledge, and full routing integration validation. Use for existing codebases where you want agents to deeply understand the project.

**Minimal**: essential files only, no docs.

## Gatekeeping Question (first run)

When \`setup\` is invoked without a mode flag (\`--full\`/\`--minimal\`), ask before starting:

> **Question:** "Setup scope — standard, full, or minimal?"
>
> 1. **Standard** — phases 0-5 + 8. Scaffold, provision, docs, verify.
> 2. **Full** — all 9 phases (0-8). Adds deep codebase mapping (Phase 6) and routing integration (Phase 7). Adds 5-15 minutes.
> 3. **Minimal** — essential files only, no docs.

Pass \`--full\` or \`--minimal\` to skip the question.

## Phases

| Phase | Name | Standard | Full | Purpose |
|-------|------|----------|------|---------|
| 0 | Verify Hubs | ✓ | ✓ | Run doctor, check global installation health |
| 1 | Detection | ✓ | ✓ | Deep stack detection via @stack-detector |
| 2 | Planning | ✓ | ✓ | Recommend global resources matching detected stack |
| 3 | Configuration | ✓ | ✓ | Create/update .opencode/opencode.jsonc with project config, then validate against schema (fetch https://opencode.ai/config.json, reject invalid keys) |
| 4 | Provisioning | ✓ | ✓ | Generate project-specific agents, skills, tools, rules into .opencode/. Also provision the stack-independent memory plane (graph-context rule + graph.db bootstrap) |
| 5 | Documentation | ✓ | ✓ | Generate hierarchical AGENTS.md via deepinit |
| 6 | Context Capture | — | ✓ | Parallel @architect + @convention-extractor + @explore map codebase, synthesize context, upgrade Phase 4 agents with deep knowledge. Then \`graph build\` folds the synthesized context into the knowledge graph |
| 7 | Routing & Integration | — | ✓ | Validate agent inheritance, skill discoverability, tool exports, rule registration, context integrity, config syntax, .gitignore, and memory-plane health (graph nodes/edges) |
| 8 | Verification | ✓ | ✓ | Final health check and summary report |

## When to choose full setup

- **Existing codebase** with substantial code (>1000 lines) — agents need deep context to be useful
- **Taking over a project** — need to understand architecture, conventions, and patterns quickly
- **Complex architecture** — microservices, monorepos, multi-package repos where surface detection isn't enough
- **Team onboarding** — want every agent to understand the project's conventions and architecture

## When standard is sufficient

- **Greenfield project** — no existing code to map, Phase 6 would have nothing to extract
- **Small project** — <1000 lines, shallow detection is adequate
- **Quick setup** — just need the scaffold, will add context manually later

Each phase writes a checkpoint to .opencode/state/init/ so setup can resume from where it left off if interrupted.`,

  tools: TOOLS_LOADSKILL_LISTAGENTS_BASH_MODESTATE,
  relatedSkills: SKILLS_SETUP_REFRESH,

  examples: [
    {
      input: "/hub-setup setup",
      approach: "Asks setup scope. Standard → runs phases 0-5 + 8. Phase 0: doctor passes. Phase 1: detect TypeScript + React + Vite + Vitest + Prisma. Phase 2: recommend skills. Phase 3: create opencode.jsonc. Phase 4: provision .opencode/ agents/skills/tools/rules. Phase 5: generate AGENTS.md. Phase 8: verify + report. Skips deep context capture (Phase 6) and routing integration (Phase 7)."
    },
    {
      input: "/hub-setup setup",
      approach: "Asks setup scope. Full → runs all 9 phases (0-8). Phases 0-5 as standard. Phase 6: spawn 3 parallel agents (@architect maps architecture, @convention-extractor extracts coding conventions, @explore maps file structure) → synthesize findings into .opencode/context/ → upgrade Phase 4 agent wrappers with deep project knowledge. Phase 7: validate all agent extends paths resolve, skills have valid frontmatter, tools have default exports, rules registered in instructions, .gitignore correct. Phase 8: final verification + integration report."
    },
    {
      input: "/hub-setup setup --full",
      approach: "Flag passed → gate skipped. On an existing monorepo: Phase 6 @architect identifies service boundaries and shared packages. @convention-extractor detects naming patterns, error handling styles, test conventions. @explore maps the full file tree. All three feed into .opencode/context/frameworks/architecture.md, .opencode/context/patterns/conventions.md, .opencode/context/theory.md. Phase 4 agents get upgraded with this context — e.g., .opencode/agents/executor.md gets a 'Project Context' section with architecture summary and convention rules."
    }
  ],

  warnings: [
    "Full setup adds significant time (3 parallel agent dispatches + context synthesis + agent upgrades). Expect 5-15 minutes depending on codebase size. The gatekeeping question lets you choose standard if you don't need it.",
    "Phase 6 requires a codebase to analyze. Choosing full on a greenfield project (no source files) will produce empty context files — choose standard instead.",
    "Phase 6 overwrites Phase 4 agent wrappers with upgraded versions containing deep context. If you manually edited agents between Phase 4 and Phase 6, those edits will be lost."
  ]
}

export default spec
