import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_LOADSKILL_BASH, RULES_KARPAHTY_GUIDELINES } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "simplify-code",
  description: "Simplify code for clarity — five-principle process: preserve behavior, follow conventions, prefer clarity, balance, scope",
  reminder: "Simplify code while preserving exact behavior.",
  skill: "code-simplification",

  detailedDescription: `Code simplification via the code-simplification skill — a process-driven, model-agnostic workflow that reduces complexity while preserving exact behavior.

The skill's five principles:
1. **Preserve behavior exactly** — same outputs, error behavior, side effects, edge cases. No test modifications to make changes pass.
2. **Follow project conventions** — match the codebase's style, don't impose external preferences.
3. **Prefer clarity over cleverness** — explicit code beats compact code that needs a mental pause to parse.
4. **Maintain balance** — avoid over-simplification traps: over-inlining, combining unrelated logic, removing useful abstractions, optimizing for line count.
5. **Scope to what changed** — default to recently modified code; no drive-by refactors.

Process: understand before touching (Chesterton's Fence — check git blame for context) → identify opportunities (deep nesting, long functions, nested ternaries, boolean flags, generic names, duplication, dead code, unnecessary abstractions) → apply changes incrementally with tests after each change (Rule of 500: automate beyond 500 lines) → verify the result and revert if not genuinely simpler.

Distinct from /project simplify (which delegates to @code-simplifier agent): this subcommand runs the skill's structured checklist directly. Use either per preference — the skill is ideal when you want the full process-driven pass with explicit verification gates.

Includes language-specific guidance for TypeScript/JavaScript, Python, and React/JSX, a common-rationalizations table, red flags, and a verification checklist.`,

  tools: TOOLS_LOADSKILL_BASH,
  rules: RULES_KARPAHTY_GUIDELINES,
  relatedSkills: [],
  examples: [
    {
      input: "/project simplify-code src/services/payment.ts",
      approach: "Load the code-simplification skill, apply Chesterton's Fence understanding pass, scan for structural/naming/redundancy signals, simplify incrementally with tests after each change, then run the verification checklist."
    },
    {
      input: "/project simplify-code --review-only",
      approach: "Run the skill's signal-scanning pass without applying changes — report opportunities (deep nesting, duplication, naming) so the user decides what to simplify."
    }
  ],
}

export default spec
