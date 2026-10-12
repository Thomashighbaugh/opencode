import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_BASH } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "add",
  description: "Quick-add wizard — write a minimal resource of any type",
  reminder: "Quick-add a resource via wizard.",
  inline: true,

  detailedDescription: `Quick-add wizard. Prompts for the essentials and writes a minimal resource file. The fast path — for full creation with scripts, references, and validation use /resource-hub create instead.

## Resource Type Gate

If the resource type is not given inline, ask via the \`question\` tool:

> **Which resource type?**
> 1. skill   2. rule   3. tool   4. command   5. agent

Pass the type inline (e.g. \`/resource-hub add rule\`) or \`--type=rule\` to skip the gate.

Then prompt for:

- Name (kebab-case).
- Description (one line — what it does).
- Scope: user (\`~/.config/opencode/\`) or project (\`.opencode/\`).

Writes the minimal file for the chosen type:

| Type    | Minimal output                     |
| ------- | ---------------------------------- |
| skill   | \`SKILL.md\` with YAML frontmatter     |
| rule    | \`.opencode/rules/{name}.md\`          |
| tool    | \`.opencode/tools/{name}.ts\` stub      |
| command | \`.opencode/commands/{name}.md\`        |
| agent   | \`agents/{name}.md\`                   |

Use when you have a simple resource to add quickly without the full creation workflow.`,

  tools: TOOLS_BASH,
  relatedSkills: [],
}

export default spec
