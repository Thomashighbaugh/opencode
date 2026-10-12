import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_LOADSKILL_BASH } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "grill",
  description: "Stress-test a plan with relentless one-at-a-time questioning",
  reminder: "Grill plans relentlessly until shared understanding. Asks: topic or plan.",
  skill: "grilling",

  detailedDescription: `Relentless Socratic questioning that stress-tests a plan or design before implementation. The griller:

1. Decomposes the plan into a decision tree.
2. Walks down each branch one question at a time — not all at once. Each question resolves one decision before moving to the next.
3. For each question, provides a recommended answer (the user can accept or override).
4. Resolves dependencies between decisions: if decision B depends on A, A is resolved first.
5. Surfaces hidden assumptions that would cause rework if discovered during implementation.

The output is a fully-stress-tested plan with every decision resolved and every assumption surfaced. Use before committing to implementation — especially for plans from /plan-hub plan, /build-hub architecture, or any design that seems "done" but might hide assumptions.

## Gatekeeping Question

Before grilling, ask (passing the flag skips the question — non-interactive path):

> **Question — what to grill?**
> 1. Type a plan/topic inline (e.g. "replace JWT auth with session cookies")
> 2. Select an existing plan file (list .opencode/state/ideation/*.md)
> (or type a path)

Resolved answer is either the inline topic or \`--plan=<file>\`.`,

  tools: TOOLS_LOADSKILL_BASH,
  relatedSkills: ["deep-interview"],

  examples: [
    {
      input: "/ideate-hub grill",
      approach: "Asks what to grill — user types the topic. Q1: 'session store — Redis or DB?' (recommends Redis). Q2 (depends on Q1): 'session expiry — sliding or absolute?' (recommends sliding). Q3: 'what happens on Redis failure?' (recommends fallback to DB). ... until every branch is resolved."
    },
    {
      input: "/ideate-hub grill --plan=auth-redesign.md",
      approach: "Flag passed → gate skipped. Same grilling, run against the named plan file."
    }
  ]
}

export default spec
