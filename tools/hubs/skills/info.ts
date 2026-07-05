import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_BASH } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "info",
  description: "Show detailed information about a skill — find by name, parse YAML frontmatter, display complete details and full content",
  reminder: "Show full skill details and content.",
  inline: true,

  detailedDescription: `Shows detailed information about a specific skill. Finds by name, parses the YAML frontmatter, and displays:

- Name, description, triggers, scope
- Full content (workflow, steps, heuristics, examples)
- Any bundled resources (scripts, references)
- Quality/usage stats from frontmatter

Use to inspect a skill before using it or to verify its content after editing.`,

  tools: TOOLS_BASH,
  relatedSkills: [],
}

export default spec