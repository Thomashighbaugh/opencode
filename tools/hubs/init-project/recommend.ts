import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "recommend",
  description: "Recommend global resources for detected stack — maps stack fingerprint to relevant skills, agents, rules, and archetype via stack-recommender skill",
  reminder: "Recommend global resources matching the detected stack.",
  skill: "stack-recommender",

  detailedDescription: `Maps a detected stack fingerprint to recommended global OpenCode resources. Reads .opencode/state/init/stack-fingerprint.json and matches it against the global resource catalog (skills, agents, rules, archetypes) using resource tags.

For each matched resource, the recommender explains why it's relevant to the detected stack. The output is a prioritized recommendation list that feeds into /init-project provision.

Use after /init-project detect to see what global resources would help this project, or standalone if you already have a stack fingerprint.`,

  tools: ["loadSkill", "bash"],
  relatedSkills: ["tag-resources"],
}

export default spec