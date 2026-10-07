import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_BASH, RULES_CONTEXT_STRATEGY } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "prune",
  description: "Archive or delete superseded context to keep the store healthy",
  reminder: "Identify and archive stale context files.",
  inline: true,

  detailedDescription: `Identifies and manages stale context files. Scans .opencode/context/ for:

- Old files (not modified in N days — configurable).
- Superseded files (a newer file covers the same topic).
- Orphaned files (reference something that no longer exists).
- Low-value files (too sparse to be useful).

**Superseded detection is not guesswork.** Run \`node skills/graph-context/scripts/graph.ts propose\` first: it asks the local classifier whether each knowledge page *claims* to replace an earlier one and writes reviewable candidates to \`.opencode/state/graph/edge-candidates.json\`. Treat those candidates as the superseded-file list — review each, then either promote the edge with \`graph accept-candidates\` or archive the page. Do not infer supersession from mtime alone; a newer file on the same topic is not necessarily a replacement.

For each stale file, the agent recommends: archive (move to .opencode/context/archive/), delete, or keep. The user confirms before any deletion.

Use periodically to keep .opencode/context/ from growing unbounded. Stale context is noise that makes search less effective.`,

  tools: TOOLS_BASH,
  rules: RULES_CONTEXT_STRATEGY,
  relatedSkills: [],
}

export default spec