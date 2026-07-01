import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "list",
  description: "List all available skills organized by scope — built-in, user (~/.config/opencode/skills/omc-learned/), and project (.opencode/state/skills/) — parse frontmatter, show quality/usage stats",
  reminder: "List all skills by scope with metadata.",
  inline: true,

  detailedDescription: `Lists all available skills organized by scope:

1. Built-in skills (~/.config/opencode/skills/): the bundled skill set (read-only).
2. User skills (~/.config/opencode/skills/omc-learned/): skills you've created or installed at user scope.
3. Project skills (.opencode/state/skills/): project-specific skills.
4. Plugin skill categories: if the opencode-skills-collection plugin is installed, show its categories.

Each skill is listed with: name, description, scope, and any quality/usage stats available from the YAML frontmatter. Output is a table for easy scanning.

Use to see what skills are available and in which scope.`,

  tools: ["bash", "skill-categories"],
  relatedSkills: [],
}

export default spec