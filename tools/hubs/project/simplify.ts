import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_LISTAGENTS_BASH, RULES_KARPAHTY_GUIDELINES } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "simplify",
  description: "Reduce code complexity — flatten nesting, simplify conditionals, clarify naming via @code-simplifier agent",
  reminder: "Reduce code complexity and improve clarity.",
  agent: "code-simplifier",

  detailedDescription: `Code simplification via the @code-simplifier agent. Reduces complexity while preserving behavior:

- Flatten deep nesting (early returns, guard clauses).
- Simplify complex conditionals (extract predicates, use lookup tables).
- Clarify naming (rename variables/functions to reveal intent).
- Reduce parameter count (parameter objects, currying).
- Remove dead branches (unreachable code).

Distinct from /project refactor (which restructures modules). Simplify works within a function/file; refactor works across files. Use when code is correct but hard to read.`,

  tools: TOOLS_LISTAGENTS_BASH,
  rules: RULES_KARPAHTY_GUIDELINES,
  relatedSkills: [],
}

export default spec