import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "analyze",
  description: "Analyze code patterns in the codebase",
  reminder: "Analyze codebase patterns and anti-patterns.",
  command: "analyze-patterns",

  detailedDescription: `Analyzes code patterns and anti-patterns across the codebase. Scans for:

- Repeated patterns (good — candidates for extraction).
- Anti-patterns (bad — should be refactored).
- Inconsistent patterns (same problem solved different ways).
- Convention violations (naming, structure, error handling).

Output: a pattern analysis report with locations and recommendations. Use to understand the codebase's conventions before refactoring or extending.`,

  tools: ["bash"],
  relatedSkills: [],
}

export default spec