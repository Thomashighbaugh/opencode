import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_LOADSKILL_BASH } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "provision",
  description: "Generate project config, rules, and agents from the stack",
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

**Memory plane (always provisioned).** In addition to the stack-specific resources, provisioning writes the stack-independent memory plane: a thin \`.opencode/rules/graph-context.md\` rule (registered under \`instructions\`), a bootstrapping \`node skills/graph-context/scripts/graph.ts build\` to create \`graph.db\`, and a \`.opencode/state/\` gitignore entry. The global \`vectorize-context\` + \`graph-context\` skills are referenced, never copied — so every project (and every archetype) inherits knowledge-graph retrieval without per-archetype duplication.

Use after /hub-setup detect + /hub-setup recommend to generate the actual config files. Or as part of /hub-setup setup (phase 3).`,

  tools: TOOLS_LOADSKILL_BASH,
  relatedSkills: ["creating-opencode-agents", "custom-agent-definitions", "stack-recommender", "tag-resources"],
}

export default spec