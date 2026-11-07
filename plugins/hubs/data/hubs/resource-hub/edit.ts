import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_BASH } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "edit",
  description: "Interactively edit a resource's metadata or content",
  reminder: "Edit resource metadata or content interactively.",
  inline: true,

  detailedDescription: `Edits an existing resource interactively. Finds it by name (searching user and project scopes), displays current values, and allows changing its metadata or body.

## Resource Type Gate

If the resource type is not given inline, ask via the \`question\` tool:

> **Which resource type?**
> 1. skill   2. rule   3. tool   4. command   5. agent

Pass the type inline (e.g. \`/resource-hub edit agent\`) or \`--type=agent\` to skip the gate.

Editable per type:

| Type    | Editable fields                                             |
| ------- | ----------------------------------------------------------- |
| skill   | description, triggers, content, name (renames the directory) |
| rule    | description, body, tags, registration                        |
| tool    | description, parameters, handler body                        |
| command | description, argument hint, body                             |
| agent   | description, model tier, mode, tools, prompt                 |

Writes changes back to the resource file. Use to refine a resource after creation or when its purpose evolves.`,

  tools: TOOLS_BASH,
  relatedSkills: [],
}

export default spec
