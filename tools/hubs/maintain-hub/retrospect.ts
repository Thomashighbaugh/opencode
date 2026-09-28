import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_BASH } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "retrospect",
  description: "Post-run retrospective analysis — extract lessons learned, error taxonomy classification, metrics across all phases",
  reminder: "Run post-run retrospective analysis.",
  inline: true,

  detailedDescription: `Post-run retrospective analysis after an orchestration or work session. Extracts:

- Lessons learned: what worked, what didn't, what to do differently.
- Error taxonomy: classifies errors by type (logic, integration, config, flaky, environmental) to find patterns.
- Metrics: phase durations, success rates, API request counts, token usage.

Output: a retrospective report saved to .opencode/state/. Use after significant work to learn from the session and improve future runs.`,

  tools: TOOLS_BASH,
  relatedSkills: [],
}

export default spec