import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_BASH } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "search",
  description: "Search resources by name, description, or content",
  reminder: "Search resources by name, triggers, or content.",
  inline: true,

  detailedDescription: `Searches resources by content, triggers, name, or description. Case-insensitive matching across all scopes (built-in, user, project). Results are ranked by relevance.

This searches resources already on disk. To discover *new* resources from external registries, use /resource-hub find.

## Resource Type Gate

If the resource type is not given inline, ask via the \`question\` tool:

> **Which resource type?**
> 1. skills   2. rules   3. tools   4. commands   5. agents   6. all

Pass the type inline (e.g. \`/resource-hub search rule\`) or \`--type=all\` to skip the gate. \`all\` is the default.

Use to find a resource when you know roughly what it does but not its exact name.`,

  tools: TOOLS_BASH,
  relatedSkills: [],
}

export default spec
