import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_BASH } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "analyze-patterns",
  description: "Analyze code patterns and anti-patterns — consistencies, convention violations",
  reminder: "Analyze codebase patterns and anti-patterns.",
  // inline — hub prompt handles this directly

  detailedDescription: `Analyzes code patterns and anti-patterns across the codebase. Scans for:

- Repeated patterns (good — candidates for extraction).
- Anti-patterns (bad — should be refactored).
- Inconsistent patterns (same problem solved different ways).
- Convention violations (naming, structure, error handling).

Output: a pattern analysis report with locations and recommendations. Use to understand the codebase's conventions before refactoring or extending.

This is a read-only analysis — no code is modified. The report is saved to .opencode/state/ for reference. Use before refactoring, extending, or when onboarding to a new codebase.`,

  tools: TOOLS_BASH,
  relatedSkills: [],
}

export default spec
