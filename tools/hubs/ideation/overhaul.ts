import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "overhaul",
  description: "Analyze project across 8 refinement dimensions — architecture, performance, security, code quality, testing, deps, DX — and produce a prioritized phased implementation plan",
  reminder: "Analyze project and produce phased improvement plan.",
  skill: "overhaul",

  detailedDescription: `Comprehensive project analysis across 8 dimensions, producing a prioritized phased improvement plan:

1. Architecture — module boundaries, coupling, layering violations
2. Performance — bottlenecks, unnecessary work, scaling risks
3. Security — vulnerabilities, auth/authz gaps, secret handling
4. Code quality — complexity, duplication, naming, error handling
5. Testing — coverage gaps, brittle tests, missing integration/e2e
6. Dependencies — outdated, vulnerable, unused, duplicate-purpose
7. Developer experience (DX) — build speed, tooling, onboarding friction
8. Documentation — missing/outdated docs, missing ADRs

Each dimension is scored. The output is a phased plan: Phase 1 addresses the highest-impact/lowest-effort findings; later phases address deeper structural issues. Each phase has verifiable outcomes.

Use for brownfield projects that need systematic improvement. NOT for greenfield (nothing to analyze) or single-issue fixes (use /project refactor or /project optimize).`,

  tools: ["loadSkill", "bash"],
  relatedSkills: [],

  examples: [
    {
      input: "/ideation overhaul",
      approach: "Analyze all 8 dimensions. Find: security has 3 critical vulns, testing at 40% coverage, architecture has circular deps. Plan: Phase 1 (security fixes + coverage to 70%), Phase 2 (break circular deps), Phase 3 (performance)."
    }
  ]
}

export default spec