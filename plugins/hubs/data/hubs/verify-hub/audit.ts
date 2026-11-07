import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_BASH, RULES_SECURITY } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "audit",
  description: "One-command health check — deps, security, quality, tests, size",
  reminder: "Run comprehensive project health audit. Asks: which surfaces.",
  inline: true,

  detailedDescription: `Comprehensive project health audit. Runs all checks in one command:

- Dependencies: outdated, vulnerable, unused, duplicate-purpose.
- Security: SAST, secrets, compliance.
- Code quality: complexity, duplication, naming, dead code.
- Test coverage: coverage %, untested critical paths.
- Bundle size: production build size, size budget adherence.
- Performance: basic profiling (build time, test suite duration).
- Meta-audit surfaces:
    - --skills: audit local skill registry for compatibility, drift, and tag coverage.
    - --rules: audit local rule set for consistency and activation coverage.
    - --commands: audit project-specific command library for validity.

Output: a single audit report with scores per dimension and an overall health grade. Use for periodic health checks or before major releases.

## Gatekeeping Question

Before auditing, ask (passing the flags skips the question — non-interactive path):

> **Question — which surfaces to audit?** (multi-select)
> 1. Project health — deps, security, quality, tests, size, performance (default)
> 2. Skills — local skill registry compatibility, drift, tag coverage
> 3. Rules — local rule set consistency and activation coverage
> 4. Commands — project-specific command library validity

Resolved answers map to \`--skills\`, \`--rules\`, and \`--commands\` (project health = no meta-audit flag).`,

  tools: TOOLS_BASH,
  rules: RULES_SECURITY,
  relatedSkills: ["vitest", "test-coverage-improver", "opencode-config", "ci-cd-and-automation", "github-actions", "find-skills", "find-rules"],
}

export default spec
