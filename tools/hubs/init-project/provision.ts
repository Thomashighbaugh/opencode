import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_LOADSKILL_BASH } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "provision",
  description: "Provision project config via project-config-composer — auto-generate .opencode/opencode.jsonc, project rules, and agent wrappers from stack fingerprint + recommendations",
  reminder: "Auto-generate .opencode/ config from stack analysis.",
  skill: "project-config-composer",

  detailedDescription: `Provisions project-specific configuration from the stack fingerprint and recommendations. The project-config-composer skill generates:

- .opencode/opencode.jsonc: project config referencing global resources + project-specific overrides.
- Project rules: .opencode/rules/ files derived from detected conventions.
- Agent wrappers: .opencode/agents/ with project context injected (e.g. "this project uses Prisma + Express + Vitest").
- Project-specific skills if the stack warrants them.
- When agent wrappers are created, loads supplementary agent-creation skills (creating-opencode-agents, custom-agent-definitions) for advanced agent patterns.

**CRITICAL:** The generated opencode.jsonc MUST be validated against the schema at https://opencode.ai/config.json. Only the following keys are valid: $schema, shell, logLevel, server, command, skills, references, watcher, snapshot, plugin, share, autoupdate, disabled_providers, enabled_providers, model, small_model, default_agent, username, agent, provider, mcp, formatter, lsp, instructions, permission, tools, attachment, enterprise, tool_output, compaction, experimental. Invalid keys (extends, agents, project, rules, state, context, cache) will cause runtime errors and MUST NOT appear in the output.

The generated config references global resources (skills, agents, rules in ~/.config/opencode/) rather than duplicating them — minimal footprint, maximum context.

Use after /init-project detect + /init-project recommend to generate the actual config files. Or as part of /init-project setup (phase 3).`,

  tools: TOOLS_LOADSKILL_BASH,
  relatedSkills: ["creating-opencode-agents", "custom-agent-definitions", "stack-recommender", "tag-resources"],
}

export default spec