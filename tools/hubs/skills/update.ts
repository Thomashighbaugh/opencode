import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "update",
  description: "Update an existing skill using skill-creator iteration workflow — read current skill, identify improvements, apply changes, validate structure",
  reminder: "Update skill content and resources.",
  inline: true,

  detailedDescription: `Updates an existing skill using the skill-creator's iteration workflow:

1. Read the current skill (content, frontmatter, resources).
2. Identify improvements (with user input or auto-detected).
3. Apply changes (content updates, new sections, revised triggers).
4. Validate the structure after changes.

Different from /skills edit (which is a simple field-by-field editor) — update uses the skill-creator's structured workflow for more comprehensive changes. Use when a skill needs significant revision rather than a quick field tweak.`,

  tools: ["bash"],
  relatedSkills: ["skill-creator"],
}

export default spec