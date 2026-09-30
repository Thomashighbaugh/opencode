import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_LOADSKILL_BASH } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "create",
  description: "Create a skill end to end, including scripts and references",
  reminder: "Full skill creation with bundled resources.",
  skill: "skill-creator",

  detailedDescription: `Full skill creation workflow via the skill-creator skill. Process:

1. Gather requirements: what should the skill do? When should it trigger? What resources does it need?
2. Plan: design the skill's structure — workflow steps, heuristics, examples, scripts, references.
3. Create: write SKILL.md with proper YAML frontmatter, workflow sections, and bundled resources.
4. Validate: check the skill structure (frontmatter, required sections, script paths).
5. Package: if validation passes, optionally package for distribution.

The full workflow handles complex skills with scripts, references, and assets. For simple skills, use /skills-hub add instead.

Use when creating a reusable skill that others (or future-you) will use.`,

  tools: TOOLS_LOADSKILL_BASH,
  relatedSkills: [],
}

export default spec