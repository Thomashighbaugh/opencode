import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "competitive-analysis",
  description: "Competitive landscape analysis — research competitors via websearch, fetch product pages/docs via webfetch, produce structured competitive analysis with feature comparison matrix",
  reminder: "Research competitors and produce feature comparison matrix.",
  inline: true,

  detailedDescription: `Competitive landscape analysis: researches competitors and produces a structured comparison. Process:

1. Identify competitors (from user input or by searching the space).
2. For each competitor: websearch for product pages, feature lists, pricing, reviews; webfetch the top pages.
3. Extract features and build a feature comparison matrix (features × competitors).
4. Identify positioning: where does each competitor differentiate?
5. Identify gaps: what's missing across the field?
6. Produce the analysis with a recommendation on positioning.

Output saved to .opencode/state/ideation/work-products/. Use for product strategy — understanding the competitive landscape before building or repositioning.`,

  tools: ["bash"],
  relatedSkills: ["web-to-markdown"],
}

export default spec