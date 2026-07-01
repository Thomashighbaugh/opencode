import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "cleanroom",
  description: "Formal correctness with box structures — black box → state box → clear box, statistical usage testing, MTTF certification",
  reminder: "Formal correctness via box structures.",
  inline: true,

  detailedDescription: `Cleanroom software development methodology emphasizing formal correctness:

1. Box structure refinement: 
   - Black box: specify behavior (input → output) without internal state.
   - State box: add internal state to the black box spec.
   - Clear box: add the internal processing (the actual logic) to the state box.
   Each refinement is verified against the previous level.

2. Statistical usage testing: test cases are drawn from a usage probability distribution (how users actually use the software), not exhaustively. This focuses testing on the paths that matter.

3. MTTF (Mean Time To Failure) certification: the software is certified based on observed failure rates during statistical testing, giving a quantitative reliability measure.

Use for safety-critical or high-reliability systems where formal correctness matters. Very rigorous — overkill for most application development.`,

  tools: ["bash"],
  relatedSkills: [],
}

export default spec