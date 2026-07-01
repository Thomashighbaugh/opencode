import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "modernize",
  description: "Update code patterns to modern language/framework conventions — targeted, behavior-preserving modernization via @refactoring agent",
  reminder: "Modernize code patterns and conventions.",
  agent: "refactoring",

  detailedDescription: `Modernizes code patterns to current language/framework conventions via the @refactoring agent. Behavior-preserving — the code does the same thing, just in the modern way.

Examples:
- var → let/const (JavaScript).
- callback chains → async/await.
- class components → function components (React).
- options API → composition API (Vue).
- manual memoization → useMemo/useCallback.
- prop spreading → explicit props.
- defaultProps → default parameters.

Each modernization is verified (tests pass before and after). Use when the codebase uses outdated patterns that make it harder to read or maintain — NOT just for fashion.`,

  tools: ["listAgents", "bash"],
  rules: ["karpathy-guidelines"],
  relatedSkills: [],
}

export default spec