import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "validate",
  description: "Validate a skill's structure without packaging — run structure checks, report errors, suggest fixes",
  reminder: "Validate skill structure and metadata.",
  inline: true,

  detailedDescription: `Validates a skill's structure without packaging it. Checks:

- SKILL.md exists and is readable.
- YAML frontmatter is valid and has required fields (name, description).
- Required sections exist (workflow or steps, depending on skill type).
- Script paths in frontmatter resolve to actual files.
- Reference paths resolve.
- No obvious issues (empty sections, broken links).

Reports errors with specific locations and suggested fixes. Use after editing a skill or before packaging to ensure it's structurally sound.`,

  tools: ["bash"],
  relatedSkills: [],
}

export default spec