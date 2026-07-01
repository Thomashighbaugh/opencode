import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "self-assess",
  description: "Iterative self-evaluation — agent executes, critically evaluates against quality thresholds, reflects and refines until targets met",
  reminder: "Self-evaluate and iterate until quality met.",
  skill: "self-improve",

  detailedDescription: `Self-referential improvement loop: the agent executes a task, then critically evaluates its own output against explicit quality thresholds, reflects on what fell short, and refines. The loop repeats until all thresholds are met or a max-iterations cap is hit.

Quality thresholds are configurable: test coverage %, lint error count, complexity score, security scan result, etc. The agent scores itself against each, identifies the weakest dimension, and targets it in the next iteration.

Unlike ralph (which loops until a verifier says "done"), self-assess makes the agent itself the verifier — it evaluates its own work critically. This builds self-correction into the execution loop rather than relying on an external verifier.

Use for tasks where quality criteria are measurable and the first attempt is unlikely to be optimal: "write a comprehensive test suite for this module", "refactor this function for readability".`,

  tools: ["bash", "loadSkill", "modeState", "taskTodos"],
  relatedSkills: [],

  examples: [
    {
      input: "/orchestrate self-assess --thresholds='coverage>=90%,lint=0,complexity<10' 'write tests for src/utils/'",
      approach: "Iter 1: write tests, run coverage (72%), lint (2 errors). Self-assess: weakest is coverage. Iter 2: add more tests, coverage 88%. Iter 3: cover edge cases, 92%. Lint 0. Complexity OK. Done."
    }
  ]
}

export default spec