import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "deep",
  description: "Socratic interview with ambiguity gating — crystallize vague requirements",
  reminder: "Socratic interview to crystallize requirements.",
  skill: "deep-interview",

  detailedDescription: `Socratic interview that interrogates every ambiguity in a vague request until requirements are concrete enough to implement without rework. Mathematical ambiguity gating: the interview won't conclude until an ambiguity score drops below a threshold.

The interviewer asks one question at a time, walks down each branch of the decision tree, and provides recommended answers to reduce user burden. Questions cover: scope boundaries, edge cases, error handling, integration points, non-functional requirements, and success criteria.

Use when a request is vague ("make the app better", "improve performance", "add reporting") and you need to crystallize it into concrete, implementable requirements before planning. The interview output is a requirements document that feeds into /ideation plan or /orchestrate patterns.`,

  tools: ["loadSkill", "bash"],
  rules: ["completion-guardrail"],
  relatedSkills: [],

  examples: [
    {
      input: "/ideation deep 'improve the app performance'",
      approach: "Q: 'which operations are slow?' A: 'page loads'. Q: 'which pages?' A: 'dashboard'. Q: 'how slow?' A: '3s'. Q: 'target?' A: '<500ms'. Q: 'what's on the dashboard?' ... continues until requirements are concrete: 'dashboard initial load <500ms, currently 3s, bottleneck is N+1 queries on the tasks widget'."
    }
  ]
}

export default spec