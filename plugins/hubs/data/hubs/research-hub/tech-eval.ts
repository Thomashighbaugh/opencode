import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_BASH, SKILLS_CONTEXT7_WEB_TO_MD } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "tech-eval",
  description: "Technology evaluation — structured pros/cons comparison against alternatives",
  reminder: "Research and evaluate technologies with structured comparison.",
  inline: true,

  detailedDescription: `Technology evaluation: research a specific library, framework, or tool and compare it against alternatives. Process:

1. Research the primary technology: websearch for docs, benchmarks, community sentiment, known issues.
2. Identify alternatives in the same category.
3. Research each alternative similarly.
4. Produce a structured evaluation table: criteria (rows) × technologies (columns). Criteria include: performance, ecosystem maturity, learning curve, maintenance burden, licensing, integration fit.
5. Pros/cons per technology.
6. Recommendation with rationale.

Output saved to .opencode/state/ideation/work-products/. Use when choosing between technologies and a wrong choice is expensive to reverse (ORM, state management, framework).`,

  tools: TOOLS_BASH,
  relatedSkills: SKILLS_CONTEXT7_WEB_TO_MD,
}

export default spec