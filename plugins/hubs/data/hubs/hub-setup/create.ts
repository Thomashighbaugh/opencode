import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_LOADSKILL_BASH } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "create",
  description: "Create a skill, rule, tool, command, or agent (type-gated)",
  reminder: "Create a resource — pick the type.",
  inline: true,

  detailedDescription: `Full end-to-end creation workflow for any OpenCode resource type. Absorbs the former per-type creators (skill / agent / command / rule) into a single type-gated command.

## Resource Type Gate

If the resource type is not given inline, ask via the \`question\` tool:

> **Which resource type?**
> 1. skill   2. rule   3. tool   4. command   5. agent

Pass the type inline (e.g. \`/resource-hub create skill\`) or \`--type=skill\` to skip the gate.

## Dispatch

Load and follow the creator for the chosen type:

| Type    | Workflow                 | Output                                              |
| ------- | ------------------------ | --------------------------------------------------- |
| skill   | \`skill-creator\`          | \`skills/{name}/SKILL.md\` + bundled scripts/references |
| rule    | \`rule-generator\`         | \`.opencode/rules/{name}.md\` (+ registration)         |
| tool    | \`tool-creator\`           | \`tools/{name}.ts\` or \`.opencode/tools/{name}.ts\`     |
| command | \`opencode-command-creator\` | \`.opencode/commands/{name}.md\`                       |
| agent   | \`opencode-agent-creator\` | \`agents/{name}.md\`                                   |

Each workflow: gather requirements → design structure → write → validate. For a quick, simple resource use /resource-hub add; to iterate an existing one use /resource-hub update.

Use when creating a reusable resource that others (or future-you) will use.`,

  tools: TOOLS_LOADSKILL_BASH,
  relatedSkills: ["skill-creator", "opencode-agent-creator", "opencode-command-creator", "rule-generator", "tool-creator"],
}

export default spec
