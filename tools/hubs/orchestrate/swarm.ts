import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "swarm",
  description: "Architect-led team of 11 specialized agents with gated QA pipeline",
  reminder: "Architect-led swarm with gated QA.",
  skill: "swarm",

  detailedDescription: `Architect-led swarm of 11 specialized agents executing through a gated QA pipeline. The architect designs the work breakdown, dispatches batches of specialized agents in parallel, and a QA gate between batches verifies quality before the next batch proceeds.

The 11-agent roster covers planning, implementation, testing, security, review, and documentation. The gated pipeline prevents downstream batches from building on unverified upstream work — a batch must pass its QA gate before the next one starts.

Use for large features that benefit from specialized parallel execution with quality gates: "implement the full authentication system with OAuth, 2FA, rate limiting, and audit logging". The architect ensures coherence; the QA gates prevent cascading errors.

State: .opencode/state/orchestration/swarm-{session}/ holds the architect's plan, batch logs, and gate results.`,

  tools: ["loadSkill", "listAgents", "modeState", "taskTodos", "bash"],
  rules: ["completion-guardrail"],
  relatedSkills: ["verify"],

  warnings: [
    "11 agents × multiple batches = very high API request consumption. Reserve for large, well-scoped features."
  ]
}

export default spec