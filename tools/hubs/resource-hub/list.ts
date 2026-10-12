import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_BASH_SKILLCATEGORIES } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "list",
  description: "List resources by scope with quality and usage stats",
  reminder: "List resources by scope with metadata.",
  inline: true,

  detailedDescription: `Lists available resources organized by scope.

## Resource Type Gate

If the resource type is not given inline, ask via the \`question\` tool:

> **Which resource type?**
> 1. skills   2. rules   3. tools   4. commands   5. agents   6. all

Pass the type inline (e.g. \`/resource-hub list rules\`) or \`--type=rules\` to skip the gate. \`all\` lists every type.

Scopes:

1. Built-in (\`~/.config/opencode/skills/\` etc.): the bundled set (read-only).
2. User (\`~/.config/opencode/\`): resources created or installed at user scope.
3. Project (\`.opencode/\`): project-specific resources.

Each resource is listed with: name, description, scope, and any quality/usage stats. Output is a table for easy scanning.

Use to see what is available and in which scope.`,

  tools: TOOLS_BASH_SKILLCATEGORIES,
  relatedSkills: [],
}

export default spec
