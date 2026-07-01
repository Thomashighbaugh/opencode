import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "research",
  description: "Multi-model synthesis — diverse perspectives merged into one answer",
  reminder: "Synthesize diverse model perspectives.",
  skill: "ccg",

  detailedDescription: `Research via multi-model synthesis: queries multiple diverse models on the research question, then merges their perspectives into a single converged answer. Different models surface different considerations, catch different errors, and propose different approaches.

Use for research questions where a single model's perspective is insufficient: "what are the tradeoffs between these 3 state management approaches", "how do these databases compare for our workload". The synthesis step reconciles disagreements.

This is the /ideation equivalent of /orchestrate ccg — same multi-model mechanism, used for research rather than execution decisions.`,

  tools: ["loadSkill", "bash"],
  relatedSkills: ["ask"],
}

export default spec