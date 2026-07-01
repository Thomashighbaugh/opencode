import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "tdd",
  description: "Test-driven development loop — red-green-refactor: write failing test, make it pass, refactor, repeat until all features covered",
  reminder: "Red-green-refactor TDD loop.",
  inline: true,

  detailedDescription: `Strict TDD cycle repeated until the feature is complete:

1. Red: write a test that captures the next requirement. Run it — it MUST fail (the code doesn't exist yet or doesn't handle this case).
2. Green: write the minimum code to make the test pass. Run it — it MUST pass.
3. Refactor: clean up the code (extract functions, improve naming, remove duplication) WITHOUT changing behavior. Run tests — they MUST still pass.
4. Repeat: write the next test for the next requirement.

The loop continues until all acceptance criteria are covered by passing tests. The orchestrator tracks which requirements are tested and which remain.

Use for features where correctness is critical and the requirements are testable. NOT for exploratory work, UI polish, or tasks where tests can't meaningfully express the requirement.`,

  tools: ["bash", "taskTodos", "modeState"],
  relatedSkills: ["verify"],

  examples: [
    {
      input: "/orchestrate tdd 'implement a rate limiter: 100 req/min per IP, 429 on exceed, sliding window'",
      approach: "Red: test 'allows 100 requests'. Green: trivial limiter. Red: test 'rejects 101st'. Green: add counter. Red: test 'sliding window resets after 60s'. Green: add time logic. Refactor: extract window logic. Repeat until all edge cases covered."
    }
  ]
}

export default spec