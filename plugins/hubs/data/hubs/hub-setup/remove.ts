import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_BASH } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "remove",
  description: "Remove a resource by name after confirming",
  reminder: "Delete a resource after confirmation.",
  inline: true,

  detailedDescription: `Removes a resource by name. Non-destructive by default — requires explicit confirmation.

## Resource Type Gate

If the resource type is not given inline, ask via the \`question\` tool:

> **Which resource type?**
> 1. skill   2. rule   3. tool   4. command   5. agent

Pass the type inline (e.g. \`/resource-hub remove skill\`) or \`--type=skill\` to skip the gate.

Searches both user and project scopes, shows exactly what will be deleted, and asks for confirmation before removing. Warns if the resource is not found in either scope.

Use to clean up resources that are no longer needed.`,

  tools: TOOLS_BASH,
  relatedSkills: [],
}

export default spec
