import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "review",
  description: "Full code review round — analyze recent changes, run security scan, check complexity, produce a review report",
  reminder: "Run full code review round.",
  inline: true,

  detailedDescription: `Full code review round. Analyzes recent changes (since last commit/branch) across multiple dimensions:

1. Change analysis: what changed, why, is the change appropriate?
2. Security scan: are there new vulnerabilities? (runs /project scan logic).
3. Complexity check: did the changes introduce complexity hotspots?
4. Convention adherence: do the changes follow existing conventions?
5. Test coverage: are the changes tested?
6. Edge cases: are edge cases handled?

Output: a structured review report with pass/warn/fail per dimension and specific recommendations. Use before merging a PR or when you want a thorough review of recent work.`,

  tools: ["bash", "listAgents"],
  relatedSkills: [],
}

export default spec