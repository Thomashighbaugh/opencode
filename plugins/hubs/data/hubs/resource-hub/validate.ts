import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_BASH } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "validate",
  description: "Check a resource's structure and report what to fix",
  reminder: "Validate resource structure and metadata.",
  inline: true,

  detailedDescription: `Validates a resource's structure without packing it. Reports errors with specific locations and suggested fixes. Use after editing or before packaging.

## Resource Type Gate

If the resource type is not given inline, ask via the \`question\` tool:

> **Which resource type?**
> 1. skill   2. rule   3. tool   4. command   5. agent

Pass the type inline (e.g. \`/resource-hub validate skill\`) or \`--type=skill\` to skip the gate.

Checks per type (common core + type-specific):

| Type    | Checks                                                              |
| ------- | ------------------------------------------------------------------- |
| skill   | SKILL.md exists; valid frontmatter (name, description); sections; script/reference paths resolve |
| rule    | file exists; description present; body non-empty; tags valid          |
| tool    | TypeScript parses; schema + handler exported; \`tool-scaffolder\` validation passes |
| command | frontmatter valid; body non-empty; \`$ARGUMENTS\` usage consistent       |
| agent   | frontmatter valid (name, description, mode, tools); \`<Agent_Prompt>\` wrapper where required |

Reports errors with specific locations and suggested fixes.`,

  tools: TOOLS_BASH,
  relatedSkills: [],
}

export default spec
