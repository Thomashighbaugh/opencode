import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_LOADSKILL_BASH } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "recommend",
  description: "Map the detected stack to recommended global resources",
  reminder: "Recommend global resources matching the detected stack.",
  skill: "stack-recommender",

  detailedDescription: `Maps a detected stack fingerprint to recommended global OpenCode resources. Reads .opencode/state/init/stack-fingerprint.json and matches it against the global resource catalog (skills, agents, rules, archetypes) using resource tags.

Each archetype contains four subdirectories: agents/, rules/, skills/, and tools/. When provisioning a project, all four must be included: agents/ and rules/ are referenced in opencode.jsonc (via the agent and instructions keys), while skills/ and tools/ must be copied or linked into the project's .opencode/ directory so that agents and rules which reference them resolve correctly.

For each matched resource, the recommender explains why it's relevant to the detected stack. The output is a prioritized recommendation list that feeds into /scaffold-hub provision.

Use after /scaffold-hub detect to see what global resources would help this project, or standalone if you already have a stack fingerprint.`,

  tools: TOOLS_LOADSKILL_BASH,
  relatedSkills: ["tag-resources"],
}

export default spec