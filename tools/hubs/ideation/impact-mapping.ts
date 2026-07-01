import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "impact-mapping",
  description: "Why-who-how-what goal mapping — trace deliverables to business impact",
  reminder: "Map goals to business impact.",
  inline: true,

  detailedDescription: `Impact mapping traces deliverables back to business goals through a four-level map:

1. Why (business goal): what business outcome are we trying to achieve? (e.g. "reduce churn by 20%").
2. Who (actors): who can produce the impact? (e.g. "at-risk users", "support team").
3. How (impacts): what behavior change in those actors produces the goal? (e.g. "at-risk users see value before they cancel").
4. What (deliverables): what features deliver the impact? (e.g. "in-app value recap email at day 30").

The map ensures every deliverable traces to a business goal. If a feature can't be traced to a goal, it's cut. This prevents feature bloat and keeps the roadmap goal-oriented.

Output: an impact map (tree structure) + prioritized deliverables. Use for roadmap planning and feature prioritization where business alignment matters.`,

  tools: ["bash"],
  relatedSkills: ["graph-thinking"],
}

export default spec