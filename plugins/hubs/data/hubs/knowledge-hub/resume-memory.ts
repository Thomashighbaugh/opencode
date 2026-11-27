import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_RUNTIME } from "../shared-spec-fragments"

const spec: HubSubcommandSpec = {
  label: "resume-memory",
  description: "Resume a prior session from its memory checkpoint",
  reminder: "Resume from the most recent memory checkpoint.",
  inline: true,

  detailedDescription: `Resume a prior session from its checkpoint. "memory" here means the checkpoint and memory store, distinct from resume-thinking (ideation) and resume-orchestration (runs).

1. Call the \`runtime\` tool with action \`resume\` to find the most recent checkpoint (trigger, mode, quality, active files).
2. Summarize where the prior session left off and list the active files.
3. Optionally recall the checkpoint's decisions with the \`runtime\` action \`recall\` before continuing.

Use when returning to previous work whose session is gone.`,

  tools: TOOLS_RUNTIME,
  relatedSkills: ["vectorize-context"],
}

export default spec
