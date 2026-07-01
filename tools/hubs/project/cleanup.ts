import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "cleanup",
  description: "Regression-safe cleanup of AI-generated slop — dead code, redundant comments, unused exports via ai-slop-cleaner skill",
  reminder: "Clean up AI-generated code slop safely.",
  skill: "ai-slop-cleaner",

  detailedDescription: `Regression-safe cleanup of AI-generated code slop. The ai-slop-cleaner skill removes:

- Dead code (unreachable, unused).
- Redundant comments (comments that restate the code).
- Unused exports (exported but never imported elsewhere).
- AI signature patterns: over-defensive error handling for impossible cases, speculative abstractions, unnecessary config flags.

The "regression-safe" part: the skill uses a deletion-first workflow with verification. Each deletion is verified to not break tests before committing. Optional reviewer-only mode flags issues without applying changes.

Use when an AI session has left the codebase messier than it found it. Especially useful after /orchestrate autopilot or /orchestrate vibe-code runs.`,

  tools: ["loadSkill", "bash"],
  relatedSkills: [],
}

export default spec