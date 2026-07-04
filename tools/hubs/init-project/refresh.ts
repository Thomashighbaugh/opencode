import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "refresh",
  description: "Update existing config preserving manual edits — re-detect stack, merge new recommendations, re-provision; --full adds deep codebase mapping, context synthesis, and routing integration validation",
  reminder: "Update config preserving manual edits. Use --full for deep codebase re-mapping and context refresh.",
  skill: "init-project",
  phases: "0-8 (merge)",

  detailedDescription: `Updates an existing project configuration without losing manual edits. Two modes:

**Default mode** (no flag): Re-runs phases 0-5 + 8 in merge mode. Re-detects the stack, merges new recommendations, re-provisions agents/skills/tools/rules (preserving manual edits), regenerates docs, and verifies.

**Full mode** (\`--full\`): Re-runs all 9 phases (0-8) in merge mode. In addition to the default behavior, it re-runs Phase 6 (deep codebase mapping via parallel agents, context synthesis, agent upgrade) and Phase 7 (routing integration validation) — preserving existing context and manual edits while refreshing the deep analysis.

## Phases (all run in merge mode)

| Phase | Name | Default | --full | Merge Behavior |
|-------|------|---------|--------|----------------|
| 0 | Verify Hubs | ✓ | ✓ | Check global health |
| 1 | Detection | ✓ | ✓ | Re-detect stack, diff against last fingerprint, report changes |
| 2 | Planning | ✓ | ✓ | Merge new recommendations with existing config |
| 3 | Configuration | ✓ | ✓ | Merge new fields into opencode.jsonc, don't remove user-set values |
| 4 | Provisioning | ✓ | ✓ | Add new agents/skills/tools/rules, preserve manually edited ones, flag stale resources |
| 5 | Documentation | ✓ | ✓ | Update generated AGENTS.md sections, preserve \`<!-- MANUAL -->\` blocks |
| 6 | Context Capture | — | ✓ | Re-spawn parallel agents, diff context against existing, update changed sections only |
| 7 | Routing & Integration | — | ✓ | Validate all cross-references, fix broken ones, generate updated integration report |
| 8 | Verification | ✓ | ✓ | Final health check + diff report showing what changed |

## What --full adds to refresh

- **Deep codebase re-mapping**: Re-spawns @architect, @convention-extractor, @explore to analyze the current codebase state. If the codebase has evolved (new modules, refactored architecture, changed conventions), the context files are updated to reflect the new reality.
- **Context diff**: Existing context files in .opencode/context/ are diffed against new analysis. Changed sections are updated; unchanged sections are preserved. Manual additions (marked with \`<!-- MANUAL -->\`) are never overwritten.
- **Agent re-upgrade**: Phase 4 agent wrappers are re-upgraded with the refreshed deep context. If agents were manually edited since last setup, those edits are preserved in MANUAL blocks and the context sections are updated around them.
- **Integration re-validation**: Phase 7 validates all cross-references, fixes broken extends paths, registers new skills/rules, and generates an updated integration report.

## When to use refresh --full

- **Codebase has evolved significantly** — new modules, major refactors, architectural changes since last init
- **New conventions adopted** — team changed naming patterns, error handling style, testing approach
- **New dependencies added** — want context files to reflect new libraries and their integration patterns
- **Context feels stale** — agents are giving generic advice that doesn't match the current codebase
- **After a merger/acquisition** — codebase absorbed another project, need to re-map the combined architecture

## When default refresh is sufficient

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

  tools: ["loadSkill", "listAgents", "bash", "modeState"],
  relatedSkills: ["stack-recommender", "provision", "deepinit", "hubs-doctor"],

  examples: [
    {
      input: "/init-project refresh",
      approach: "Merge mode phases 0-5 + 8. Phase 0: doctor passes. Phase 1: re-detect stack, diff against last fingerprint — new dependency 'zod' found. Phase 2: merge new recommendations. Phase 3: add zod-related skills to opencode.jsonc. Phase 4: provision new agent wrapper for validation, preserve existing manually-edited agents. Phase 5: update AGENTS.md file tables. Phase 8: verify + diff report."
    },
    {
      input: "/init-project refresh --full",
      approach: "Merge mode, all 9 phases. Phases 0-5 same as default. Phase 6: re-spawn @architect (detects new module 'payments-service' added since last init), @convention-extractor (detects team switched to functional style), @explore (maps new file tree). Diff existing context files — update architecture.md with payments-service module, update conventions.md with functional style patterns, preserve MANUAL sections. Re-upgrade agent wrappers with refreshed context. Phase 7: validate all extends paths still resolve, register any new skills, fix broken refs. Phase 8: verify + full integration report with change diff."
    },
    {
      input: "/init-project refresh --full --force",
      approach: "Same as refresh --full but skips the merge safety checks. Overwrites generated sections completely (still preserves MANUAL blocks). Use when context is badly stale and you want a clean regeneration of all auto-generated content without losing manual additions."
    }
  ],

  warnings: [
    "--full adds significant time (3 parallel agent dispatches + context synthesis + agent re-upgrade). Expect 5-15 minutes depending on codebase size.",
    "Phase 6 in refresh mode diffs new analysis against existing context. If existing context files have no MANUAL blocks, they are fully overwritten. Add <!-- MANUAL --> tags to preserve custom sections.",
    "Agent re-upgrade in Phase 6 preserves MANUAL blocks in agent wrappers but overwrites auto-generated context sections. If you manually edited the auto-generated sections of an agent, those edits will be lost — use --force to skip all safety or add MANUAL blocks.",
    "Stale resources (agents/skills/tools that no longer match the detected stack) are flagged, NOT deleted. Review and remove manually if no longer needed."
  ]
}

export default spec