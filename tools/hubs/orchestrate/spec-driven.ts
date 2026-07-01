import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "spec-driven",
  description: "Spec-first development — formalize spec, validate it, then implement against it",
  reminder: "Spec-first: formalize, validate, implement.",
  inline: true,

  detailedDescription: `Spec-first development with three explicit phases:

Phase 1 — Formalize: take the user's natural-language request and produce a formal specification document. The spec includes acceptance criteria, edge cases, error modes, and interface contracts. Saved to .opencode/state/orchestration/spec-{session}/spec.md.

Phase 2 — Validate: review the spec against the codebase and constraints. Check for ambiguity, missing edge cases, contradictions with existing code, and feasibility. The spec is revised until it passes validation. No implementation begins until the spec is solid.

Phase 3 — Implement: build against the spec. Each implementation decision is traced back to a spec requirement. The verifier checks the implementation against the spec's acceptance criteria, not just "does it run".

Use when requirements are complex enough that building without a spec risks rework. For simple tasks, this is overhead — use plan-execute or ralph instead. The spec document becomes a durable artifact that survives the session.`,

  tools: ["listAgents", "taskTodos", "modeState", "bash"],
  rules: ["completion-guardrail", "karpathy-guidelines"],
  relatedSkills: ["verify"],

  examples: [
    {
      input: "/orchestrate spec-driven 'add role-based access control with admin, editor, viewer roles'",
      approach: "Formalize: write spec with role definitions, permission matrix, edge cases (role escalation, inheritance). Validate: check for contradictions. Implement: build RBAC middleware, tests per role scenario."
    }
  ]
}

export default spec