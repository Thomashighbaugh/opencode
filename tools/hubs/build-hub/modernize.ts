import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_LISTAGENTS_BASH, RULES_KARPAHTY_GUIDELINES } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "modernize",
  description: "Update code patterns to modern language/framework conventions — targeted, behavior-preserving modernization via the code-simplification skill",
  reminder: "Modernize code patterns and conventions.",
  skill: "code-simplification",

  detailedDescription: `Modernizes code patterns to current language/framework conventions via the code-simplification skill. Behavior-preserving — the code does the same thing, just in the modern way.

Examples:
- var → let/const (JavaScript).
- callback chains → async/await.
- class components → function components (React).
- options API → composition API (Vue).
- manual memoization → useMemo/useCallback.
- prop spreading → explicit props.
- defaultProps → default parameters.

Each modernization is verified (tests pass before and after). Use when the codebase uses outdated patterns that make it harder to read or maintain — NOT just for fashion.`,

  tools: TOOLS_LISTAGENTS_BASH,
  rules: RULES_KARPAHTY_GUIDELINES,
  relatedSkills: [],
}

export default spec