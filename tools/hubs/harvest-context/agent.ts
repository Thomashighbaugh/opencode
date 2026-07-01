import { HubSubcommandSpec } from "../../hub-data"

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

The agent is saved to agents/{name}.md with proper YAML frontmatter. It becomes available immediately for delegation via the Task tool.

Use when you need a specialized agent for a project-specific domain — e.g. a "migration-agent" that knows the legacy system's patterns, or a "domain-agent" that understands the business domain.`,

  tools: ["loadSkill", "bash"],
  relatedSkills: [],
}

export default spec