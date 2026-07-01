import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "compare",
  description: "Compare alternatives via web research — research multiple options (libraries, tools, approaches) via websearch + webfetch, produce structured comparison table with recommendations",
  reminder: "Research and compare alternatives with structured comparison.",
  inline: true,

  detailedDescription: `Compare alternatives via web research. Researches multiple options (libraries, tools, approaches) and produces a structured comparison.

Process:
1. Take the alternatives to compare (from user input).
2. For each: websearch for docs, benchmarks, reviews, known issues; webfetch top results.
3. Build a comparison table: criteria (rows) × alternatives (columns).
4. Score each alternative on each criterion.
5. Produce a recommendation with rationale.

Output: comparison table + recommendation, saved to .opencode/state/harvest/. Use when choosing between multiple options and the decision benefits from side-by-side comparison.`,

  tools: ["bash"],
  relatedSkills: ["context7-docs", "web-to-markdown"],
}

export default spec