import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "arch-prep",
  description: "Architecture preparation for upcoming features — design extension points, plan module additions, anticipate refactoring runway before coding",
  reminder: "Design architecture to accommodate upcoming features.",
  agent: "architect",

  detailedDescription: `Architecture preparation: designs the architectural runway for upcoming features BEFORE coding begins. The @architect agent:

1. Reviews the upcoming feature(s) and their requirements.
2. Identifies extension points: where should the new code attach? Are existing interfaces sufficient, or do they need to grow?
3. Plans module additions: new modules needed, their boundaries, their interfaces.
4. Anticipates refactoring runway: what existing code needs to change to accommodate the new feature cleanly? (E.g. extract an interface, introduce a seam, move a responsibility.)

The output is an architecture preparation document that makes the subsequent implementation smoother — the seams and extension points are designed upfront, not discovered mid-implementation.

Use when a feature is complex enough that "just start coding" will lead to rework. The prep work is cheaper than refactoring mid-implementation.`,

  tools: ["listAgents", "bash"],
  relatedSkills: ["adr-skill"],
}

export default spec