import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_LISTAGENTS_BASH, SKILLS_HUBS_DOCTOR } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "verify",
  description: "Validate configuration completeness, file existence, and reference integrity",
  reminder: "Validate configuration completeness and integrity.",
  agent: "verifier",
  phases: "7",

  detailedDescription: `Validates that the project configuration is complete and all references resolve. The @verifier agent checks:

- opencode.jsonc: valid schema keys per https://opencode.ai/config.json (fetch schema, extract valid keys, reject invalid keys like extends/agents/project/rules/state/context/cache), all referenced files exist.
- Agents: all agent files referenced in config exist and have valid frontmatter.
- Skills: all skill references resolve to SKILL.md files.
- Tools: all tool references resolve to .ts files.
- Commands: all command references resolve to .md files.
- Rules: all rule references resolve to .md files.
- Hub delegations: all skill/agent/command references in hub subcommands resolve (runs validate-delegation tool).

Schema validation step:
1. Fetch https://opencode.ai/config.json
2. Navigate to $defs.Config.properties — extract the set of valid top-level keys
3. Parse the project's opencode.jsonc (strip JSONC comments first)
4. Check that all keys in the parsed config appear in the valid set
5. Fail if any unrecognized keys are found (e.g., extends, agents, project, rules, state, context, cache)
6. Report specific invalid keys and suggest removal

Output: a validation report with pass/fail per check and specific error messages for failures. Use after setup or after manual config changes to ensure nothing is broken.`,

  tools: TOOLS_LISTAGENTS_BASH,
  relatedSkills: SKILLS_HUBS_DOCTOR,
}

export default spec