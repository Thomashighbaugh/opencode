import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "deep",
  description: "2-stage: causal trace → deep interview to crystallize requirements",
  reminder: "Trace root cause, then crystallize requirements.",
  skill: "deep-dive",

  detailedDescription: `Two-stage pipeline combining causal investigation with requirements crystallization:

Stage 1 — Trace (causal): Dispatches the @tracer agent to investigate a problem or symptom using competing hypotheses. The tracer collects evidence for/against each hypothesis, tracks uncertainty, and recommends the next probe. Output: a root-cause report with confidence levels.

Stage 2 — Deep Interview (requirements): Injects the trace report at 3 points into a Socratic interview (the @deep-interview skill) that interrogates the user about every ambiguity, edge case, and constraint. The interview gates on mathematical ambiguity scoring — it won't proceed to implementation until requirements are concrete enough to execute without rework.

Use when a bug or feature request is vague AND its root cause is unclear. The trace phase ensures you understand the problem before you try to solve it; the interview phase ensures the solution spec is concrete before you build.

State: .opencode/state/orchestration/deep-{session}/ holds the trace report and interview transcript.`,

  tools: ["loadSkill", "taskTodos", "bash"],
  relatedSkills: ["trace", "deep-interview"],

  examples: [
    {
      input: "/orchestrate deep 'users report intermittent login failures'",
      approach: "Stage 1: tracer forms hypotheses (token expiry race, DB connection pool, clock skew). Stage 2: interview asks about failure frequency, user segments, environment, reproduction steps."
    }
  ]
}

export default spec