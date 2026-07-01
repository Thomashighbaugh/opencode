import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "rpikit",
  description: "Research-Plan-Implement with stakes-based rigor scaling and 'Iron Law' — don't touch code until problem is understood",
  reminder: "Research-Plan-Implement with stakes rigor.",
  inline: true,

  detailedDescription: `Research-Plan-Implement (RPI) methodology with stakes-based rigor scaling:

1. Research: understand the problem before touching code. The "Iron Law" — don't write code until the problem is understood. Research depth scales with stakes: a typo fix needs minimal research; a payment system needs deep research.
2. Plan: produce an implementation plan informed by the research.
3. Implement: build against the plan.

Stakes-based rigor scaling:
- Low stakes (typo, cosmetic): minimal research, direct implementation.
- Medium stakes (feature, refactor): moderate research, plan then implement.
- High stakes (security, payment, data migration): deep research, formal plan, review before implementation.

The Iron Law prevents the common LLM failure of jumping to code before understanding the problem. Use when the stakes warrant research before implementation — especially for high-stakes changes.`,

  tools: ["bash", "taskTodos"],
  rules: ["karpathy-guidelines"],
  relatedSkills: [],
}

export default spec