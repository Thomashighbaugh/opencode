import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_LOADSKILL_BASH } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "find",
  description: "Discover resources from registries — skills, agents, rules, tools, commands",
  reminder: "Search registries for relevant project resources.",
  inline: true,

  detailedDescription: `Discovers *new* installable resources relevant to the project by searching registries. Absorbs the former \`find-skills\` / \`find-agents\` / \`find-rules\` / \`find-tools\` subcommands into one type-gated command.

This searches external registries. To search resources already on disk, use /resource-hub search.

## Resource Type Gate

If the resource type is not given inline, ask via the \`question\` tool:

> **Which resource type?**
> 1. skills   2. agents   3. rules   4. tools   5. commands

Pass the type inline (e.g. \`/resource-hub find rules\`) or \`--type=rules\` to skip the gate.

## Dispatch

Load and follow the finder for the chosen type:

| Type     | Finder skill    | Sources                                     | Install target |
| -------- | --------------- | ------------------------------------------- | -------------- |
| skills   | \`find-skills\`   | skills.sh, clawhub.ai, GitHub               | \`.opencode/\`    |
| agents   | \`find-agents\`   | agent registries, GitHub                    | installed as skills |
| rules    | \`find-rules\`    | GitHub, skills.sh, local template catalog   | \`.opencode/rules/\` |
| tools    | \`find-tools\`    | GitHub, npm, local template catalog         | \`.opencode/tools/\` |
| commands | \`find-commands\` | GitHub, skills.sh, local command packs      | \`.opencode/commands/\` |

Each: search sources in parallel → security-scan top hits → present ranked recommendations with source reputation → user selects which to install.

Use during /hub-setup setup/refresh or standalone to extend the project's resource set.`,

  tools: TOOLS_LOADSKILL_BASH,
  relatedSkills: ["find-skills", "find-agents", "find-rules", "find-tools", "find-commands"],
}

export default spec
