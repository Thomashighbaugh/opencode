import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "verify",
  description: "Validate configuration completeness, file existence, and reference integrity",
  reminder: "Validate configuration completeness and integrity.",
  agent: "verifier",
  phases: "7",

  detailedDescription: `Validates that the project configuration is complete and all references resolve. The @verifier agent checks:

- opencode.jsonc: valid schema, all referenced files exist.
- Agents: all agent files referenced in config exist and have valid frontmatter.
- Skills: all skill references resolve to SKILL.md files.
- Tools: all tool references resolve to .ts files.
- Commands: all command references resolve to .md files.
- Rules: all rule references resolve to .md files.
- Hub delegations: all skill/agent/command references in hub subcommands resolve (runs validate-delegation tool).

Output: a validation report with pass/fail per check and specific error messages for failures. Use after setup or after manual config changes to ensure nothing is broken.`,

  tools: ["listAgents", "bash"],
  relatedSkills: ["hubs-doctor"],
}

export default spec