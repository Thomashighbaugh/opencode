import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_BASH_SKILLCATEGORIES } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "scan",
  description: "Fast non-interactive inventory of all resource scopes",
  reminder: "Quick inventory scan of resource directories.",
  inline: true,

  detailedDescription: `Quick non-interactive inventory scan. No interaction — just a summary. Use for a fast overview without the full /resource-hub list detail.

## Resource Type Gate

If the resource type is not given inline, ask via the \`question\` tool:

> **Which resource type?**
> 1. skills   2. rules   3. tools   4. commands   5. agents   6. all

Pass the type inline (e.g. \`/resource-hub scan tools\`) or \`--type=all\` to skip the gate. \`all\` is the default.

Reports per type and scope:

- Built-in resources: count + path.
- User resources: count + path.
- Project resources: count + path.
- Plugin skill categories (if installed): counts per category.`,

  tools: TOOLS_BASH_SKILLCATEGORIES,
  relatedSkills: [],
}

export default spec
