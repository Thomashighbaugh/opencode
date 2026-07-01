import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "constitution",
  description: "Establish project governance — code quality, UX, performance, and security principles as input to spec-driven work",
  reminder: "Establish project governance principles.",
  inline: true,

  detailedDescription: `Establishes project governance principles — a "constitution" that subsequent work must comply with. Covers:

- Code quality principles: complexity limits, duplication thresholds, coverage minimums.
- UX principles: accessibility standards, performance budgets, interaction patterns.
- Performance principles: response time targets, query complexity limits, bundle size limits.
- Security principles: auth requirements, data handling rules, dependency vetting.

The constitution is saved as a durable artifact (.opencode/context/decisions.md or a dedicated governance doc). Subsequent /ideation spec-driven and /orchestrate work references the constitution as constraints.

Use at the start of a project (or a major reset) to establish non-negotiable principles before features are built. Prevents the "we should have decided that earlier" problem.`,

  tools: ["bash"],
  rules: ["security"],
  relatedSkills: ["adr-skill"],
}

export default spec