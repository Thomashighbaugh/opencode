import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "spiral",
  description: "Risk-driven iterative planning — each cycle targets highest-risk items first",
  reminder: "Risk-driven iterative planning cycles.",
  inline: true,

  detailedDescription: `Spiral development: iterative cycles where each cycle prioritizes the highest-risk items first. Each spiral:

1. Identify risks: what's most likely to fail or cause rework?
2. Plan the spiral: target the highest-risk item.
3. Implement: build the risky part first.
4. Evaluate: did the risk materialize? What did we learn?
5. Next spiral: re-rank risks with new knowledge, target the now-highest-risk item.

By attacking risk first, you learn the hard things early when rework is cheapest. If a risk kills the project, you find out in spiral 1, not spiral 10.

Use when the project has significant unknowns (technical, domain, integration) and you want to de-risk early rather than discover problems late.`,

  tools: ["bash", "taskTodos"],
  relatedSkills: [],
}

export default spec