import { HubSubcommandSpec } from "../../hub-data"

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

The generated config references global resources (skills, agents, rules in ~/.config/opencode/) rather than duplicating them — minimal footprint, maximum context.

Use after /init-project detect + /init-project recommend to generate the actual config files. Or as part of /init-project setup (phase 3).`,

  tools: ["loadSkill", "bash"],
  relatedSkills: ["stack-recommender", "tag-resources"],
}

export default spec