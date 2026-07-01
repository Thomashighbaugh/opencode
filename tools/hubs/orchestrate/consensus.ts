import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "consensus",
  description: "Multi-agent consensus/voting — run agents independently, resolve via majority, weighting, or synthesis",
  reminder: "Multi-agent consensus and voting.",
  inline: true,

  detailedDescription: `Runs N agents independently on the same task, then resolves their outputs into a single answer via one of three protocols:

1. Majority vote — the answer most agents agree on wins. Best for factual/verifiable questions.
2. Weighted vote — agents are weighted by expertise (e.g. @security-reviewer gets 2× weight on security questions). Best when agents have unequal domain expertise.
3. Synthesis — a synthesizer agent reads all responses and produces a merged answer that incorporates the best elements. Best for design/creative tasks where there's no single "correct" answer.

Use when a single agent's answer is risky (high-stakes decision, security-sensitive code, ambiguous requirements) and multiple perspectives reduce risk. The cost is N× the single-agent cost.

Configure via flags: --agents=N, --protocol=majority|weighted|synthesis.`,

  tools: ["listAgents", "modeState", "bash"],
  relatedSkills: ["self-consistency"],

  examples: [
    {
      input: "/orchestrate consensus --agents=3 --protocol=synthesis 'design the API rate limiting strategy'",
      approach: "3 agents independently design. Synthesizer reads all 3 designs, merges into one strategy document."
    }
  ],

  warnings: [
    "N× API cost. Justified only for high-stakes decisions where a wrong answer is expensive."
  ]
}

export default spec