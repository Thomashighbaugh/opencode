import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "evolutionary",
  description: "Evolutionary delivery — incremental builds with fitness validation at each generation",
  reminder: "Incremental builds with fitness validation.",
  inline: true,

  detailedDescription: `Evolutionary delivery: build the system in generations, each generation adding capability and validated against a fitness function before the next generation proceeds.

Generation 0: minimal viable skeleton (passes build, no features).
Generation 1: first feature slice (passes build + that feature's tests).
Generation 2: second feature slice (passes build + all accumulated tests).
...continue until all features delivered.

The fitness function is configurable: "all tests pass", "lint clean + tests pass", "tests pass + security scan clean", etc. If a generation fails its fitness check, the orchestrator fixes it before advancing — no generation is built on a broken predecessor.

Use when a feature set is large enough that building it all at once risks compounding errors, and each increment is independently valuable. The fitness gate ensures you always have a working system.`,

  tools: ["listAgents", "taskTodos", "modeState", "bash"],
  rules: ["completion-guardrail"],

  examples: [
    {
      input: "/orchestrate evolutionary --fitness='npm test' 'implement user, post, comment, and like resources'",
      approach: "Gen 0: empty server skeleton. Gen 1: user CRUD + tests. Gen 2: post CRUD + tests. Gen 3: comments. Gen 4: likes. Each gen must pass 'npm test' before next."
    }
  ]
}

export default spec