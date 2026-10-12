import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_BASH } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "sync",
  description: "Sync resources between user and project scope, showing diff",
  reminder: "Sync resources across user and project scopes.",
  inline: true,

  detailedDescription: `Syncs resources between user scope (\`~/.config/opencode/\`) and project scope (\`.opencode/\`).

## Resource Type Gate

If the resource type is not given inline, ask via the \`question\` tool:

> **Which resource type?**
> 1. skills   2. rules   3. tools   4. commands   5. agents

Pass the type inline (e.g. \`/resource-hub sync skill\`) or \`--type=skill\` to skip the gate.

Process:

1. Scan both scopes for that type.
2. Categorize: only in user, only in project, in both.
3. For resources in both: show the diff (identical or divergent versions?).
4. Offer to copy or merge with confirmation.

Use to propagate a resource from user scope to a project (or vice versa), or reconcile differences between scopes.`,

  tools: TOOLS_BASH,
  relatedSkills: [],
}

export default spec
