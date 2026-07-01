import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "refactor",
  description: "Restructure code without changing behavior — extract functions, split modules, reduce coupling via @refactoring agent",
  reminder: "Restructure code without changing behavior.",
  agent: "refactoring",

  detailedDescription: `Code refactoring via the @refactoring agent. Restructures code to improve maintainability WITHOUT changing behavior. Techniques:

- Extract function: move a code block into a named function.
- Extract module: split a large file into cohesive modules.
- Reduce coupling: introduce interfaces, invert dependencies.
- Consolidate conditionals: simplify complex if/else chains.
- Rename for clarity: improve names to reveal intent.

The refactoring agent verifies behavior is preserved (tests pass before and after). Changes are surgical — only the refactor, no feature additions or "improvements" to adjacent code.

Use when code is hard to maintain but works correctly. For code that's broken, fix first, then refactor.`,

  tools: ["listAgents", "bash"],
  rules: ["karpathy-guidelines"],
  relatedSkills: [],
}

export default spec