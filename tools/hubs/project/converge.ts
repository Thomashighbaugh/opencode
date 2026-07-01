import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "converge",
  description: "5-gate quality convergence — functional tests, lint/complexity, type safety, security scanning, performance thresholds with progressive target escalation",
  reminder: "Run 5-gate quality convergence.",
  inline: true,

  detailedDescription: `Five-gate quality convergence pipeline. Each gate must pass before the next, and targets escalate progressively:

Gate 1 — Functional tests: all tests pass. Target: 100% pass rate.
Gate 2 — Lint/complexity: lint clean, complexity under threshold. Target: 0 lint errors, complexity < 10.
Gate 3 — Type safety: type check passes (tsc, mypy, etc.). Target: 0 type errors.
Gate 4 — Security scanning: SAST scan clean, no known vulnerabilities. Target: 0 critical/high findings.
Gate 5 — Performance thresholds: meets perf budget (response time, bundle size, memory). Target: within budget.

Progressive target escalation: if a gate barely passes, the target is tightened on the next run. This drives quality up over time without a single big push.

Use for release readiness — confirms the project meets all quality bars before shipping.`,

  tools: ["bash"],
  relatedSkills: [],

  examples: [
    {
      input: "/project converge",
      approach: "Gate 1: tests pass (100%). Gate 2: lint clean, complexity 8. Gate 3: tsc passes. Gate 4: security scan — 1 high finding (outdated dep). Fix: update dep. Re-run: pass. Gate 5: bundle 240kb (budget 250kb). Pass. Converged."
    }
  ]
}

export default spec