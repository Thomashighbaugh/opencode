import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "package",
  description: "Package a skill for distribution — validate structure, create distributable zip if validation passes",
  reminder: "Validate and package skill for distribution.",
  inline: true,

  detailedDescription: `Packages a skill for distribution. Process:

1. Validate the skill structure (frontmatter, required sections, script paths resolve).
2. If validation passes: create a distributable zip containing the skill directory.
3. If validation fails: report errors and suggest fixes — do not package.

The resulting zip can be shared and installed by others. Use when you want to distribute a skill to other OpenCode users or publish to a skill registry.`,

  tools: ["bash"],
  relatedSkills: [],
}

export default spec