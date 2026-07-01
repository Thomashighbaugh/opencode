import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "metaswarm",
  description: "Autonomous issue-to-PR with 12 agents, 7 phases, adversarial reviews with fresh reviewers to block anchoring bias",
  reminder: "12-agent autonomous issue-to-PR pipeline.",
  inline: true,

  detailedDescription: `Large-scale autonomous issue-to-PR pipeline with 12 specialized agents across 7 phases:

1. Issue analysis: parse the GitHub issue, extract requirements, constraints, and acceptance criteria.
2. Architecture: design the solution approach.
3. Planning: decompose into implementation tasks.
4. Implementation: parallel agents implement the tasks.
5. Adversarial review: fresh reviewers (who haven't seen the implementation) review the PR. Using fresh reviewers prevents anchoring bias — they don't know what the implementer intended, only what the code does.
6. Fix loop: address review findings.
7. Final: merge-ready PR.

The adversarial review with fresh reviewers is the key innovation — reviewers who didn't watch the implementation catch issues that implementer-aware reviewers miss (they don't have the context that would let them rationalize the code).

Use for significant features tracked as GitHub issues where you want a production-quality PR as output. Very high API cost — 12 agents × 7 phases. Reserve for high-value work.`,

  tools: ["bash", "listAgents", "modeState", "taskTodos"],
  relatedSkills: [],

  warnings: [
    "12 agents × 7 phases = very high API request consumption. Reserve for high-value issues where the PR quality justifies the cost."
  ]
}

export default spec