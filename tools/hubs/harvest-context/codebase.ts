import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "codebase",
  description: "Generate hierarchical AGENTS.md across the codebase",
  reminder: "Generate hierarchical AGENTS.md documentation.",
  skill: "deepinit",

  detailedDescription: `Generates hierarchical AGENTS.md documentation across the entire codebase. Scans each directory, understands the code, and writes an AGENTS.md in each meaningful directory with:

- What the directory/module does
- Key files and their purposes
- Patterns and conventions used
- Dependencies on other modules
- Testing approach

The hierarchy means parent AGENTS.md files summarize, and child files detail. An agent reading any AGENTS.md gets context for that directory without needing to read all the files.

This is the same skill as /init-project docs. Use when you need comprehensive codebase documentation for AI navigation — especially before a large refactoring or onboarding.`,

  tools: ["loadSkill", "bash"],
  relatedSkills: [],
}

export default spec