import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "ccg",
  description: "Multi-model synthesis — query diverse models, merge perspectives",
  reminder: "Synthesize multiple model perspectives.",
  skill: "ccg",

  detailedDescription: `Multi-model orchestration via the 'ask' command pattern. Queries several diverse models (different providers/architectures) on the same question, then synthesizes their responses into a single converged answer.

The value is diversity: different models catch different errors, surface different considerations, and propose different approaches. The synthesis step reconciles disagreements and produces a single answer that's stronger than any individual model's output.

Use when a design decision, architecture choice, or complex analysis would benefit from multiple expert perspectives — especially when the cost of a wrong decision is high. NOT for routine implementation tasks where one model's answer is sufficient.

Configure via flags: --models=<comma-separated> to pick which models to query (default: a diverse set). The synthesizer agent reads all responses and produces the final answer.`,

  tools: ["bash", "loadSkill"],
  relatedSkills: ["ask"],
}

export default spec