import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_BASH_LISTAGENTS } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "review",
  description: "Full review round — changes, security scan, complexity",
  reminder: "Run full code review round.",
  inline: true,

  detailedDescription: `Full code review round. Analyzes recent changes (since last commit/branch) across multiple dimensions:

1. Change analysis: what changed, why, is the change appropriate?
2. Security scan: are there new vulnerabilities? (runs /maintain-hub scan logic).
3. Complexity check: did the changes introduce complexity hotspots?
4. Convention adherence: do the changes follow existing conventions?
5. Test coverage: are the changes tested?
6. Edge cases: are edge cases handled?

Output: a structured review report with pass/warn/fail per dimension and specific recommendations. Use before merging a PR or when you want a thorough review of recent work.`,

  tools: TOOLS_BASH_LISTAGENTS,
  relatedSkills: [],
}

export default spec