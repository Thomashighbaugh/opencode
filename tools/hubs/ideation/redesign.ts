import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "redesign",
  description: "Audit and upgrade existing websites/apps to premium design standards — scan codebase, diagnose generic AI patterns (overused gradients, Lucide icons, centered card columns), apply targeted upgrades without breaking functionality",
  reminder: "Audit and upgrade to premium design standards.",
  skill: "redesign-existing-projects",

  detailedDescription: `Audits and upgrades existing UI to premium design standards. Process:

1. Scan the codebase for generic AI-generated design patterns: overused gradients, default Lucide icons everywhere, centered card columns, generic Tailwind defaults, "AI slop" visual signatures.
2. Diagnose each instance and propose a targeted upgrade: distinctive visual elements, considered iconography, asymmetric layouts, custom design tokens.
3. Apply upgrades WITHOUT breaking functionality — the audit is visual, the fixes are surgical. Existing behavior is preserved.
4. Works with any CSS framework (Tailwind, CSS modules, styled-components, MUI).

Use for existing apps that look "AI-generated" and need to look designed. The skill knows the specific patterns that signal generic AI output and how to replace them with premium alternatives.`,

  tools: ["loadSkill", "bash"],
  relatedSkills: [],
}

export default spec