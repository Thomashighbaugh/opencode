import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_BASH } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "info",
  description: "Show a resource's full frontmatter and content",
  reminder: "Show full resource details and content.",
  inline: true,

  detailedDescription: `Shows detailed information about a specific resource. Finds it by name, parses its metadata, and displays the full picture.

## Resource Type Gate

If the resource type is not given inline, ask via the \`question\` tool:

> **Which resource type?**
> 1. skill   2. rule   3. tool   4. command   5. agent

Pass the type inline (e.g. \`/resource-hub info tool\`) or \`--type=tool\` to skip the gate.

Displays:

- Name, description, triggers/metadata, scope.
- Full content (workflow, steps, heuristics, examples).
- Any bundled resources (scripts, references).
- Quality/usage stats where available.

Use to inspect a resource before using it or to verify its content after editing.`,

  tools: TOOLS_BASH,
  relatedSkills: [],
}

export default spec
