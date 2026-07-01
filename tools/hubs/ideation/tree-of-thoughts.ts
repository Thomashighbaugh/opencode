import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "tree-of-thoughts",
  description: "⚠️ EXPENSIVE: Explore multiple solution branches in parallel (~10× cost). Warns user and asks for confirmation before proceeding. Use for open-ended design problems where the best path is unclear",
  reminder: "Branching exploration with cost warning.",
  skill: "tree-of-thoughts",

  detailedDescription: `Tree of Thoughts exploration: explores multiple solution branches in parallel, evaluates each, and recommends the best path. Unlike linear reasoning (which commits to one approach), ToT branches at decision points and explores alternatives.

Process:
1. Identify decision points in the problem.
2. At each decision point, branch: explore each alternative in parallel as a sub-agent.
3. Evaluate each branch's outcome (does it look promising?).
4. Prune weak branches, expand promising ones.
5. Continue until terminal nodes are reached, then recommend the best path.

The cost is high because each branch is a separate reasoning chain. The skill warns the user and asks for confirmation before proceeding.

Use for open-ended design problems where the best approach is genuinely unclear and exploring alternatives has high value. NOT for tasks where the approach is known — that's a waste of 10× the cost.`,

  tools: ["loadSkill", "listAgents", "bash"],
  warnings: [
    "⚠️ EXPENSIVE: ~10× cost due to parallel branch exploration. The skill asks for confirmation before proceeding. Only use for genuinely ambiguous problems."
  ]
}

export default spec