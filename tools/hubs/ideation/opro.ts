import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_LOADSKILL_BASH } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "opro",
  description: "⚠️ EXPENSIVE: Optimize prompts by testing variations against benchmarks",
  reminder: "Prompt optimization with cost warning.",
  skill: "opro",

  detailedDescription: `Optimization by PROmpting (OPRO): generates candidate prompt variations, tests each against a benchmark, and reports the best performer. Process:

1. Take the prompt to optimize and a benchmark (test cases with expected outputs).
2. Generate N prompt variations (different phrasings, structures, emphasis).
3. Run each variation against the benchmark.
4. Score each by how well it performs (accuracy, conciseness, adherence to format).
5. Report the best-performing variation and the scores.

The cost is high (N × benchmark size LLM calls). The skill warns the user and asks for confirmation.

Use for prompt optimization when a prompt is used repeatedly and small improvements compound. Also for periodic maintenance of system prompts. NOT for one-off prompts — the optimization cost exceeds the benefit.`,

  tools: TOOLS_LOADSKILL_BASH,
  warnings: [
    "⚠️ EXPENSIVE: cost scales with N variations × benchmark size. The skill asks for confirmation before proceeding. Only use for prompts that are reused enough to justify optimization."
  ]
}

export default spec