import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "readme",
  description: "Update README to reflect current codebase state — scans agents, skills, tools, rules, commands; preserves tone, links, and structure; SEO-optimized output via readme-updater skill",
  reminder: "Update README with current codebase state.",
  skill: "readme-updater",

  detailedDescription: `Updates the README to reflect the current codebase state via the readme-updater skill. Scans:

- Agents, skills, tools, rules, commands, archetypes, plugins.
- Project structure and configuration.
- Existing README content.

Preserves the existing tone, links, and structure — it updates content, doesn't rewrite from scratch. Output is SEO-optimized and technically proficient.

Use when the codebase has changed significantly and the README is stale. Not for creating a README from scratch (use /harvest-context command or writing skills for that).`,

  tools: ["loadSkill", "bash"],
  relatedSkills: ["crafting-effective-readmes"],
}

export default spec