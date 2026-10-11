import { HubSubcommandSpec } from "../../hub-data"

import { SKILLS_ASK } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "ccg",
  description: "Multi-model synthesis — query diverse models, merge perspectives",
  reminder: "Synthesize multiple model perspectives. Asks: which models.",
  skill: "ccg",

  detailedDescription: `Multi-model orchestration via the 'ask' command pattern. Queries several diverse models (different providers/architectures) on the same question, then synthesizes their responses into a single converged answer.

The value is diversity: different models catch different errors, surface different considerations, and propose different approaches. The synthesis step reconciles disagreements and produces a single answer that's stronger than any individual model's output.

Use when a design decision, architecture choice, or complex analysis would benefit from multiple expert perspectives — especially when the cost of a wrong decision is high. NOT for routine implementation tasks where one model's answer is sufficient.

## Gatekeeping Question

Before querying, ask (passing the flag skips the question — non-interactive path):

> **Question — which models?** (multi-select; default: a diverse set)
> 1. Diverse default set — one strong model per provider
> 2. Fast set — cheap/fast models, more of them
> 3. Reasoning set — reasoning-tuned models only
> (select any combination, or type your own comma-separated list)

Resolved answer maps to \`--models=<comma-separated>\`. The synthesizer agent reads all responses and produces the final answer.`,

  tools: ["bash", "loadSkill"],
  relatedSkills: SKILLS_ASK,

  examples: [
    {
      input: "/orchestrate-hub ccg 'is this locking strategy deadlock-free?'",
      approach: "Asks which models (diverse default set). Queries each model independently, then synthesizes a converged answer with the disagreements called out."
    }
  ],
}

export default spec
