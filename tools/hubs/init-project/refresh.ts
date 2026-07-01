import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "refresh",
  description: "Update existing configuration — preserve manual edits, merge new detections, rerun recommend+provision",
  reminder: "Update config preserving manual edits.",
  skill: "init-project",
  phases: "0-8 (merge)",

  detailedDescription: `Updates an existing project configuration without losing manual edits. Reruns detection, recommendation, and provision, but:

- Preserves manually edited files (detects manual edits vs generated).
- Merges new recommendations with existing config rather than overwriting.
- Reports what changed (new resources added, stale resources flagged).

Use when the project stack has changed (new dependencies, new tools) or when global resources have been updated and you want to pull in new recommendations. Safe to run on existing setups — it won't destroy manual work.`,

  tools: ["loadSkill", "bash"],
  relatedSkills: ["stack-recommender", "provision"],
}

export default spec