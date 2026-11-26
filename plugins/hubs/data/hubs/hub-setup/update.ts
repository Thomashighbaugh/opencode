import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_LOADSKILL_BASH } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "update",
  description: "Iterate an existing resource through the creator workflow",
  reminder: "Update resource content and resources.",
  inline: true,

  detailedDescription: `Updates an existing resource using the matching creator's iteration workflow:

1. Read the current resource (content, metadata, bundled resources).
2. Identify improvements (with user input or auto-detected).
3. Apply changes (content updates, new sections, revised triggers/metadata).
4. Validate the structure after changes.

Different from /resource-hub edit (a simple field-by-field editor) — update uses the creator's structured workflow for more comprehensive changes.

## Resource Type Gate

If the resource type is not given inline, ask via the \`question\` tool:

> **Which resource type?**
> 1. skill   2. rule   3. tool   4. command   5. agent

Pass the type inline (e.g. \`/resource-hub update skill\`) or \`--type=skill\` to skip the gate.

Dispatch: skill → \`skill-creator\`, rule → \`rule-generator\`, tool → \`tool-creator\`, command → \`opencode-command-creator\`, agent → \`opencode-agent-creator\`.`,

  tools: TOOLS_LOADSKILL_BASH,
  relatedSkills: ["skill-creator", "opencode-agent-creator", "opencode-command-creator", "rule-generator", "tool-creator"],
}

export default spec
