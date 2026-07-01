import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "lean-canvas",
  description: "Lean business model canvas — one-page framework for problem, solution, key metrics, and competitive advantage",
  reminder: "One-page lean business model canvas.",
  inline: true,

  detailedDescription: `Lean Canvas: a one-page business model framework with sections:

1. Problem: top 3 problems.
2. Customer segments: target customers and early adopters.
3. Unique value proposition: the single clear message.
4. Solution: top 3 features addressing the problems.
5. Channels: paths to customers.
6. Revenue streams: how money is made.
7. Cost structure: customer acquisition costs, distribution, hosting, people.
8. Key metrics: activities to measure success.
9. Unfair advantage: what can't be easily copied.

The canvas forces concision — one page, no fluff. Use for product/business strategy at the idea stage, before committing to implementation. Helps validate the business model before building.`,

  tools: ["bash"],
  relatedSkills: [],
}

export default spec