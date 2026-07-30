import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_BASH, RULES_CONTEXT_STRATEGY, SKILLS_ADR } from "../shared-spec-fragments"

const spec: HubSubcommandSpec = {
  label: "consolidate-telemetry",
  description: "Consolidate SRCL telemetry log into proposed ADRs in decisions.md",
  reminder: "Consolidate telemetry log into ADR proposals.",
  inline: true,

  detailedDescription: `Consolidates the Self-Refining Config Loop (SRCL) telemetry log at .opencode/state/telemetry.ndjson into a proposed ADR appended to .opencode/context/decisions.md.

**Workflow:**

1. Read the NDJSON log (event-by-event, stream-friendly).
2. Group by event kind; compute rolling metrics for the requested window (default: 7 days).
3. Detect patterns:
   - **High-frequency skills/rules** not currently in frontmatter triggers.
   - **Hub subcommands** that were rejected or rerouted (action=menu after action=route).
   - **Cache miss hot-spots** — same key missing repeatedly.
   - **Repeated file reads** — same path read N times across sessions.
4. Draft an ADR with: observed patterns, proposed changes (concrete, file-specific), evidence (event counts), rollback (git checkout).
5. Append to .opencode/context/decisions.md (or .opencode/context/proposed-improvements.md if it exists).
6. Print a summary table to the terminal.

**Flags:**
- \`--since 7d\` — window (default: 7d, accepts Nd/Nh/Nm).
- \`--dry-run\` — print ADR to stdout, do not write to disk.
- \`--output FILE\` — write to alternate path (default: decisions.md).

**Hot-path cost:** zero. The consolidation step runs only on explicit invocation and does LLM-free pattern detection. A user can call \`/ideation tree-of-thoughts\` after consolidation to brainstorm alternatives if the proposals feel weak.

**Validation commands:**
- \`wc -l .opencode/state/telemetry.ndjson\` — log size.
- \`tail -20 .opencode/context/decisions.md\` — most recent ADR.

See skill \`adr-skill\` for ADR structure conventions. See \`opencode/state/ideation/work-products/20260723_180000_refine_self-refining-config-loop.md\` for the design one-pager.`,

  tools: TOOLS_BASH,
  rules: RULES_CONTEXT_STRATEGY,
  relatedSkills: SKILLS_ADR,
}

export default spec
