import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "maestro",
  description: "Strict role separation — PMs gather requirements, Architects design/review (never code), Coders implement/test (never self-review)",
  reminder: "Strict role separation factory.",
  inline: true,

  detailedDescription: `Pipeline with strict role separation to prevent self-review bias:

- PM role (@analyst or @requirements-analyzer): gathers and crystallizes requirements. Does NOT design or code.
- Architect role (@architect): designs the system, reviews implementations. Does NOT write implementation code — reviews only. This prevents the "I wrote it so I'll approve it" bias.
- Coder role (@executor): implements the design and writes tests. Does NOT self-review — the architect reviews.

The flow: PM → requirements doc → Architect → design doc → Coder → implementation → Architect → review → (fixes if needed) → Coder → tests → Architect → final approval.

The strict separation means no agent approves its own work. This catches more defects than self-review but costs more API requests due to the review round-trips.

Use for quality-critical features where self-review bias is a real risk. Overkill for routine work.`,

  tools: ["listAgents", "taskTodos", "modeState", "bash"],
  relatedSkills: [],

  examples: [
    {
      input: "/orchestrate maestro 'implement the payment webhook handler with idempotency'",
      approach: "PM: interview about idempotency requirements. Architect: design idempotency key strategy, review existing webhooks. Coder: implement per design. Architect: review — flags 'missing replay attack prevention'. Coder: fix. Architect: approve."
    }
  ]
}

export default spec