import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "command",
  description: "Create a project slash command",
  reminder: "Create a project slash command.",
  skill: "opencode-command-creator",

  detailedDescription: `Creates a project-specific slash command in .opencode/commands/. A command is a markdown file with YAML frontmatter that defines a reusable workflow triggered by /command-name.

The command-creator workflow:
1. Define the command: name, description, argument hint.
2. Write the command body: instructions, steps, $ARGUMENTS placeholders.
3. Optionally register in opencode.jsonc.
4. Save to .opencode/commands/{name}.md.

The new command is immediately available. Use for project-specific workflows that you invoke repeatedly: "/deploy-checklist", "/db-migrate", "/release-prep".`,

  tools: ["loadSkill", "bash"],
  relatedSkills: [],
}

export default spec