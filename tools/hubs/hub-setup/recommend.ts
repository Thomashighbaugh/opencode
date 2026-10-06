import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_LOADSKILL_BASH } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "recommend",
  description: "Map the detected stack to recommended global resources",
  reminder: "Recommend global resources matching the detected stack.",
  skill: "stack-recommender",

  detailedDescription: `Maps a detected stack fingerprint to recommended global OpenCode resources. Reads .opencode/state/init/stack-fingerprint.json and matches it against the global resource catalog (skills, agents, rules, archetypes) using resource tags.

Each archetype is a hint pack (templates/projects/*/manifest.json): it carries hints, research pointers, and preferences, and is a starting point — never a copy payload. The recommender records local availability ({found, none}) and, where a pack is absent or silent on the specific needed, researches (Context7 / SearXNG / gh_grep) and caches under .opencode/context/research/.

For each matched resource, the recommender explains why it's relevant to the detected stack. The output is a prioritized recommendation list that feeds into /hub-setup provision.

Use after /hub-setup detect to see what global resources would help this project, or standalone if you already have a stack fingerprint.`,

  tools: TOOLS_LOADSKILL_BASH,
  relatedSkills: ["tag-resources"],
}

export default spec