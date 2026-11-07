import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_BASH } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "setup",
  description: "Wizard — create resource dirs, scan inventory, choose actions",
  reminder: "Set up resource directories and inventory.",
  inline: true,

  detailedDescription: `Interactive setup wizard for resource directories.

## Resource Type Gate

If the resource type is not given inline, ask via the \`question\` tool:

> **Which resource type?**
> 1. skills   2. rules   3. tools   4. commands   5. agents

Pass the type inline (e.g. \`/resource-hub setup agent\`) or \`--type=agent\` to skip the gate. With no type given, steps run across all types.

Steps:

1. Create the resource directories if they don't exist (user + project scope).
2. Scan the existing inventory in both scopes.
3. Offer actions: add a new resource, list existing, scan the current conversation for opportunities, import a resource from a file/URL, or done.

Use when first setting up a resource type for a project or user account.`,

  tools: TOOLS_BASH,
  relatedSkills: ["learner"],
}

export default spec
