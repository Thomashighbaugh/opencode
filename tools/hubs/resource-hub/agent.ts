import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_LOADSKILL_BASH, SKILLS_AGENT_CREATION } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "agent",
  description: "Create a project-specific agent",
  reminder: "Create a project-specific agent.",
  skill: "opencode-agent-creator",

  detailedDescription: `Creates a project-specific OpenCode agent using the agent-creator workflow. Defines:

- Agent name and description
- Model tier (Pro, Default, Fast)
- Mode (primary or subagent)
- Tools the agent has access to
- The agent's prompt (role, constraints, workflow, output format)
- Links to related community agent-creation skills for advanced patterns

The agent is saved to agents/{name}.md with proper YAML frontmatter. It becomes available immediately for delegation via the Task tool.

**Supplementary skills loaded automatically:**
- \`creating-opencode-agents\` — in-depth guide for agent definition best practices, model selection, permission scoping
- \`custom-agent-definitions\` — advanced agent patterns (isolated research agent, read-only explorer, security auditor)

Use when you need a specialized agent for a project-specific domain — e.g. a "migration-agent" that knows the legacy system's patterns, or a "domain-agent" that understands the business domain.`,

  tools: TOOLS_LOADSKILL_BASH,
  relatedSkills: SKILLS_AGENT_CREATION,
}

export default spec