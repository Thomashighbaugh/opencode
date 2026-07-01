import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "brownfield",
  description: "Feature addition to existing codebase — analyze system, identify integration points, validate strategy before implementation",
  reminder: "Analyze and integrate into existing codebase.",
  skill: "brownfield",

  detailedDescription: `Feature addition to an EXISTING codebase (greenfield would use a different pattern). Three phases with a mandatory validation gate before implementation:

1. Analyze system: map the existing architecture, conventions, integration points, and constraints. The @explore and @architect agents understand the codebase before touching it.
2. Identify integration points: where does the new feature connect? What existing modules change? What new modules are needed? What conventions must be followed?
3. Validate strategy: the integration plan is reviewed before any code is written. This gate prevents the common LLM mistake of implementing a feature that fights the existing architecture. Only after validation passes does implementation begin.

The emphasis is on respecting the existing system — matching its conventions, minimizing disruption, and integrating cleanly. NOT on rewriting or "improving" existing code (surgical changes principle).

Use when adding a feature to a codebase you didn't write (or that has established conventions). The validation gate is the key — it catches "this doesn't fit the existing architecture" before you've written 200 lines.`,

  tools: ["loadSkill", "listAgents", "bash"],
  rules: ["karpathy-guidelines"],
  relatedSkills: [],

  examples: [
    {
      input: "/orchestrate brownfield 'add audit logging to the existing API'",
      approach: "Analyze: existing logger is winston, routes are Express middleware. Integration: add audit middleware after auth. Validate: does it fit the middleware chain? Yes. Implement: add the middleware matching existing patterns."
    }
  ]
}

export default spec