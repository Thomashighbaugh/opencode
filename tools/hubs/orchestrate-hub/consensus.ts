import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_LISTAGENTS_MODESTATE_BASH, SKILLS_SELF_CONSISTENCY } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "consensus",
  description: "Run agents independently, then resolve by vote or synthesis",
  reminder: "Multi-agent consensus and voting. Asks: agent count + protocol.",
  inline: true,

  detailedDescription: `Runs N agents independently on the same task, then resolves their outputs into a single answer via one of three protocols:

1. Majority vote — the answer most agents agree on wins. Best for factual/verifiable questions.
2. Weighted vote — agents are weighted by expertise (e.g. @security-reviewer gets 2× weight on security questions). Best when agents have unequal domain expertise.
3. Synthesis — a synthesizer agent reads all responses and produces a merged answer that incorporates the best elements. Best for design/creative tasks where there's no single "correct" answer.

Use when a single agent's answer is risky (high-stakes decision, security-sensitive code, ambiguous requirements) and multiple perspectives reduce risk. The cost is N× the single-agent cost.

## Gatekeeping Question

Before dispatching, ask (passing the flags skips the question — non-interactive path):

> **Question 1 — number of agents?**
> 1. 3
> 2. 4
> 3. 5
> (or type your own number)
>
> **Question 2 — consensus protocol?**
> 1. Majority vote — factual/verifiable questions
> 2. Weighted vote — agents have unequal expertise
> 3. Synthesis — design/creative, no single correct answer

Resolved answers map to \`--agents=N\` and \`--protocol=...\`.`,

  tools: TOOLS_LISTAGENTS_MODESTATE_BASH,
  relatedSkills: SKILLS_SELF_CONSISTENCY,

  examples: [
    {
      input: "/orchestrate-hub consensus 'design the API rate limiting strategy'",
      approach: "Asks agent count (3) and protocol (synthesis). 3 agents independently design. Synthesizer reads all 3 designs, merges into one strategy document."
    },
    {
      input: "/orchestrate-hub consensus --agents=3 --protocol=synthesis 'design the API rate limiting strategy'",
      approach: "Flags passed → gate skipped. Same as above with explicit values."
    }
  ],

  warnings: [
    "N× API cost. Justified only for high-stakes decisions where a wrong answer is expensive."
  ]
}

export default spec
