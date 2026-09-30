import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_BASH, SKILLS_SKILL_CREATOR } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "update",
  description: "Iterate an existing skill through the skill-creator workflow",
  reminder: "Update skill content and resources.",
  inline: true,

  detailedDescription: `Updates an existing skill using the skill-creator's iteration workflow:

1. Read the current skill (content, frontmatter, resources).
2. Identify improvements (with user input or auto-detected).
3. Apply changes (content updates, new sections, revised triggers).
4. Validate the structure after changes.

Different from /skills-hub edit (which is a simple field-by-field editor) — update uses the skill-creator's structured workflow for more comprehensive changes. Use when a skill needs significant revision rather than a quick field tweak.`,

  tools: TOOLS_BASH,
  relatedSkills: SKILLS_SKILL_CREATOR,
}

export default spec