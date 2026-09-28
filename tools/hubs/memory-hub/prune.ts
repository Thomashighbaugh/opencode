import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_BASH, RULES_CONTEXT_STRATEGY } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "prune",
  description: "Stale context management — identify old or superseded context files, archive or delete them to keep .opencode/context/ healthy",
  reminder: "Identify and archive stale context files.",
  inline: true,

  detailedDescription: `Identifies and manages stale context files. Scans .opencode/context/ for:

- Old files (not modified in N days — configurable).
- Superseded files (a newer file covers the same topic).
- Orphaned files (reference something that no longer exists).
- Low-value files (too sparse to be useful).

For each, the agent recommends: archive (move to .opencode/context/archive/), delete, or keep. The user confirms before any deletion.

Use periodically to keep .opencode/context/ from growing unbounded. Stale context is noise that makes search less effective.`,

  tools: TOOLS_BASH,
  rules: RULES_CONTEXT_STRATEGY,
  relatedSkills: [],
}

export default spec