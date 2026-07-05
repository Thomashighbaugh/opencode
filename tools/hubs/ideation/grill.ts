import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_LOADSKILL_BASH } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "grill",
  description: "Stress-test a plan with relentless one-at-a-time questioning",
  reminder: "Grill plans relentlessly until shared understanding.",
  skill: "grilling",

  detailedDescription: `Relentless Socratic questioning that stress-tests a plan or design before implementation. The griller:

1. Decomposes the plan into a decision tree.
2. Walks down each branch one question at a time — not all at once. Each question resolves one decision before moving to the next.
3. For each question, provides a recommended answer (the user can accept or override).
4. Resolves dependencies between decisions: if decision B depends on A, A is resolved first.
5. Surfaces hidden assumptions that would cause rework if discovered during implementation.

The output is a fully-stress-tested plan with every decision resolved and every assumption surfaced. Use before committing to implementation — especially for plans from /ideation plan, /ideation architecture, or any design that seems "done" but might hide assumptions.`,

  tools: TOOLS_LOADSKILL_BASH,
  relatedSkills: ["deep-interview"],

  examples: [
    {
      input: "/ideation grill --plan=auth-redesign.md",
      approach: "Q1: 'session store — Redis or DB?' (recommends Redis). Q2 (depends on Q1): 'session expiry — sliding or absolute?' (recommends sliding). Q3: 'what happens on Redis failure?' (recommends fallback to DB). ... until every branch is resolved."
    }
  ]
}

export default spec