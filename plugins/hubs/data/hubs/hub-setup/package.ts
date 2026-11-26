import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_BASH } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "package",
  description: "Validate a resource, then build a distributable archive",
  reminder: "Validate and package resource for distribution.",
  inline: true,

  detailedDescription: `Packages a resource for distribution.

## Resource Type Gate

If the resource type is not given inline, ask via the \`question\` tool:

> **Which resource type?**
> 1. skill   2. rule   3. tool   4. command   5. agent

Pass the type inline (e.g. \`/resource-hub package skill\`) or \`--type=skill\` to skip the gate.

Process:

1. Validate the resource structure (see /resource-hub validate).
2. If validation passes: create a distributable zip containing the resource directory.
3. If validation fails: report errors and suggest fixes — do not package.

Not every type is distributable standalone: skills and tools package cleanly; rules, commands, and agents are usually project-local and package only when you explicitly intend to publish them.

The resulting zip can be shared and installed by others. Use to distribute a resource to other OpenCode users or publish to a registry.`,

  tools: TOOLS_BASH,
  relatedSkills: [],
}

export default spec
