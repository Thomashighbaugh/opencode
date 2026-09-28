import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_BASH, RULES_SECURITY } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "audit",
  description: "Comprehensive project health check — dependencies, security, code quality, test coverage, bundle size in one command",
  reminder: "Run comprehensive project health audit.",
  inline: true,

  detailedDescription: `Comprehensive project health audit. Runs all checks in one command:

- Dependencies: outdated, vulnerable, unused, duplicate-purpose.
- Security: SAST, secrets, compliance.
- Code quality: complexity, duplication, naming, dead code.
- Test coverage: coverage %, untested critical paths.
- Bundle size: production build size, size budget adherence.
- Performance: basic profiling (build time, test suite duration).
- Meta-audit flags:
    - --skills: audit local skill registry for compatibility, drift, and tag coverage.
    - --rules: audit local rule set for consistency and activation coverage.
    - --commands: audit project-specific command library for validity.

Output: a single audit report with scores per dimension and an overall health grade. Use for periodic health checks or before major releases.`,

  tools: TOOLS_BASH,
  rules: RULES_SECURITY,
  relatedSkills: ["vitest", "test-coverage-improver", "opencode-config", "ci-cd-and-automation", "github-actions", "find-skills", "find-rules"],
}

export default spec