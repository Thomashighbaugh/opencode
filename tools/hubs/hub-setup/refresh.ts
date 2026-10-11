import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_LOADSKILL_LISTAGENTS_BASH_MODESTATE, SKILLS_SETUP_REFRESH } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "refresh",
  description: "Re-detect the stack and re-provision, preserving manual edits",
  reminder: "Update config preserving manual edits. On first run I'll ask: standard or full refresh.",
  skill: "init-project",
  phases: "0-8 (merge)",

  detailedDescription: `Updates an existing project configuration without losing manual edits. On first run (no mode flag) it gates on a single question — **standard or full refresh?** — then runs the matching phase set.

**Standard refresh**: Re-runs phases 0-5 + 8 in merge mode. Re-detects the stack, merges new recommendations, re-provisions agents/skills/tools/rules (preserving manual edits), regenerates docs, and verifies.

**Full refresh**: Re-runs all 9 phases (0-8) in merge mode. In addition to the standard behavior, it re-runs Phase 6 (deep codebase mapping via parallel agents, context synthesis, agent upgrade) and Phase 7 (routing integration validation) — preserving existing context and manual edits while refreshing the deep analysis.

### Gatekeeping Question (first run)

When \`refresh\` is invoked without a mode flag, ask before doing any work:

> **Question:** "Refresh mode — standard or full?"
>
> 1. **Standard** — phases 0-5 + 8. Re-detect stack, merge recommendations, re-provision (preserving manual edits), update docs, verify.
> 2. **Full** — all 9 phases (0-8). Standard plus deep codebase re-mapping (Phase 6) and routing integration validation (Phase 7). Adds 5-15 minutes.

Pass \`--full\` to skip the question and force full refresh.

## References Sync (always runs)

After Phase 3 (Configuration), ensure the project's \`.opencode/opencode.jsonc\` has a \`references\` key configured per https://opencode.ai/docs/references/:

1. **Context reference**: Ensure a \`references.context\` entry exists pointing to \`./.opencode/context\` (local path reference) so the durable knowledge base is accessible to agents. Example:
   \`\`\`jsonc
   "references": {
     "context": {
       "path": "./.opencode/context",
       "description": "Durable project knowledge base — decisions, patterns, research, frameworks, and theory."
     }
   }
   \`\`\`

2. **Git repository references**: Scan all files in \`.opencode/context/\` for GitHub repository URLs matching \`github.com/owner/repo\`. For each substantive project reference (not gists, not forks, not passing mentions), ensure a \`references\` entry exists with:
   - \`repository\` set to \`owner/repo\` (GitHub shorthand)
   - \`description\` explaining when an agent should use it
   - Deduplicate variant names to the primary repo
   - If \`references\` already exists, merge new entries without removing existing ones
   - Only add repos that are substantive project references — skip gists, forks, and casual mentions

3. **Validate**: After adding references, verify the \`opencode.jsonc\` still passes schema validation (the \`references\` key is a valid top-level key per the OpenCode config schema).

## Phases (all run in merge mode)

| Phase | Name | Standard | Full | Merge Behavior |
|-------|------|---------|--------|----------------|
| 0 | Verify Hubs | ✓ | ✓ | Check global health |
| 1 | Detection | ✓ | ✓ | Re-detect stack, diff against last fingerprint, report changes |
| 2 | Planning | ✓ | ✓ | Merge new recommendations with existing config |
| 3 | Configuration | ✓ | ✓ | Merge new fields into opencode.jsonc, don't remove user-set values. Validate merged config against schema (fetch https://opencode.ai/config.json, reject invalid keys like extends/agents/project/rules/state/context/cache). **Then run References Sync (see above).** |
| 4 | Provisioning | ✓ | ✓ | Add new agents/skills/tools/rules, preserve manually edited ones, flag stale resources. Also (re)ensure the **memory plane**: \`graph-context.md\` rule, \`graph.db\` bootstrap, \`.opencode/state/\` gitignore |
| 5 | Documentation | ✓ | ✓ | Update generated AGENTS.md sections, preserve \`<!-- MANUAL -->\` blocks |
| 6 | Context Capture | — | ✓ | Re-spawn parallel agents, diff context against existing, update changed sections only. Then run \`graph build\` to fold new/changed context into the knowledge graph |
| 7 | Routing & Integration | — | ✓ | Validate all cross-references, fix broken ones, generate updated integration report. Validate memory-plane health (\`graph stats\` shows nodes/edges when context is non-empty) |
| 8 | Verification | ✓ | ✓ | Final health check + diff report showing what changed |

## What full refresh adds

- **Deep codebase re-mapping**: Re-spawns @architect, @convention-extractor, @explore to analyze the current codebase state. If the codebase has evolved (new modules, refactored architecture, changed conventions), the context files are updated to reflect the new reality.
- **Context diff**: Existing context files in .opencode/context/ are diffed against new analysis. Changed sections are updated; unchanged sections are preserved. Manual additions (marked with \`<!-- MANUAL -->\`) are never overwritten.
- **Agent re-upgrade**: Phase 4 agent wrappers are re-upgraded with the refreshed deep context. If agents were manually edited since last setup, those edits are preserved in MANUAL blocks and the context sections are updated around them.
- **Integration re-validation**: Phase 7 validates all cross-references, fixes broken extends paths, registers new skills/rules, and generates an updated integration report.

## When to choose full refresh

- **Codebase has evolved significantly** — new modules, major refactors, architectural changes since last init
- **New conventions adopted** — team changed naming patterns, error handling style, testing approach
- **New dependencies added** — want context files to reflect new libraries and their integration patterns
- **Context feels stale** — agents are giving generic advice that doesn't match the current codebase
- **After a merger/acquisition** — codebase absorbed another project, need to re-map the combined architecture

## When standard refresh is sufficient

- **Minor dependency updates** — a few new packages, no architectural changes
- **Config drift fix** — opencode.jsonc needs syncing, no codebase changes
- **Global resource update** — new skills/agents available, want to pull in recommendations
- **Quick health check** — just verify everything is still valid

## Merge Mode Rules

All phases run in merge mode:
1. **Read existing** — parse current config, agents, context, AGENTS.md
2. **Diff** — compare current state vs new analysis
3. **Preserve manual edits** — keep \`<!-- MANUAL -->\` blocks in all files
4. **Update generated sections** — refresh auto-generated content with new data
5. **Add new resources** — new agents/skills/tools/rules from new recommendations
6. **Flag stale resources** — resources that no longer match the detected stack are flagged (not deleted)
7. **Report changes** — summary of what was added, updated, flagged as stale

Safe to run on existing setups — it won't destroy manual work.`,

  tools: TOOLS_LOADSKILL_LISTAGENTS_BASH_MODESTATE,
  relatedSkills: SKILLS_SETUP_REFRESH,

  examples: [
    {
      input: "/init-project refresh",
      approach: "Gatekeeping question first: 'standard or full refresh?' User picks **Standard** → merge mode phases 0-5 + 8. Phase 0: doctor passes. Phase 1: re-detect stack, diff against last fingerprint — new dependency 'zod' found. Phase 2: merge new recommendations. Phase 3: add zod-related skills to opencode.jsonc. Phase 4: provision new agent wrapper for validation, preserve existing manually-edited agents. Phase 5: update AGENTS.md file tables. Phase 8: verify + diff report."
    },
    {
      input: "/init-project refresh",
      approach: "Gatekeeping question first. User picks **Full** → merge mode, all 9 phases. Phases 0-5 same as Standard. Phase 6: re-spawn @architect (detects new module 'payments-service' added since last init), @convention-extractor (detects team switched to functional style), @explore (maps new file tree). Diff existing context files — update architecture.md with payments-service module, update conventions.md with functional style patterns, preserve MANUAL sections. Re-upgrade agent wrappers with refreshed context. Phase 7: validate all extends paths still resolve, register any new skills, fix broken refs. Phase 8: verify + full integration report with change diff."
    },
    {
      input: "/init-project refresh --full",
      approach: "Skips the gatekeeping question — forces full refresh (all 9 phases, merge mode). Use when the mode is already known or for scripted/repeat invocations."
    },
    {
      input: "/init-project refresh --force",
      approach: "Merge safety checks skipped. Overwrites generated sections completely (still preserves MANUAL blocks). Use when context is badly stale and you want a clean regeneration of all auto-generated content without losing manual additions."
    }
  ],

  warnings: [
    "Full refresh adds significant time (3 parallel agent dispatches + context synthesis + agent re-upgrade). Expect 5-15 minutes depending on codebase size. The gatekeeping question lets you choose standard if you don't need it.",
    "Phase 6 in refresh mode diffs new analysis against existing context. If existing context files have no MANUAL blocks, they are fully overwritten. Add <!-- MANUAL --> tags to preserve custom sections.",
    "Agent re-upgrade in Phase 6 preserves MANUAL blocks in agent wrappers but overwrites auto-generated context sections. If you manually edited the auto-generated sections of an agent, those edits will be lost — use --force to skip all safety or add MANUAL blocks.",
    "Stale resources (agents/skills/tools that no longer match the detected stack) are flagged, NOT deleted. Review and remove manually if no longer needed."
  ]
}

export default spec