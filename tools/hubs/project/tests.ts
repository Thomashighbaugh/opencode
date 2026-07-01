import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "tests",
  description: "Generate comprehensive 8-type test suite",
  reminder: "Generate comprehensive 8-type test suite.",
  command: "create-tests",

  detailedDescription: `Generates a comprehensive test suite covering 8 test types per unit under test:

1. Happy path — expected input → expected output.
2. Edge cases — empty, null, max, min, boundary values.
3. Error cases — invalid input, failures, exceptions.
4. Integration — interaction with dependencies.
5. Concurrency — race conditions, ordering (where applicable).
6. Performance — timing/complexity assertions (where applicable).
7. Regression — tests for known bugs to prevent recurrence.
8. Property-based — invariant testing (where applicable).

The generator reads the code under test, infers its contract, and writes tests for each type. Output goes to the project's test directory following existing conventions.

Use when you need thorough test coverage quickly, especially for critical modules.`,

  tools: ["bash"],
  relatedSkills: [],
}

export default spec