import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "story-mapping",
  description: "User story mapping — arrange features along a user journey spine, prioritize by release for iterative delivery",
  reminder: "Map features along user journey.",
  inline: true,

  detailedDescription: `User story mapping: arranges features/stories along a user journey spine (the horizontal axis = steps in the user's journey) with priority lanes (the vertical axis = must-have, should-have, could-have).

Process:
1. Map the user journey backbone: the key steps a user takes (e.g. "sign up → onboard → first use → daily use → refer").
2. For each step, brainstorm stories/features that serve it.
3. Prioritize vertically: the top lane is the minimum viable journey (release 1), lower lanes are subsequent releases.
4. The map reveals the minimum end-to-end journey (top lane) and the full vision (all lanes).

Output: a story map (markdown table or Mermaid) + release plan. Use for product planning where you want to sequence features by user value and deliver in vertical slices.`,

  tools: ["bash"],
  relatedSkills: [],
}

export default spec