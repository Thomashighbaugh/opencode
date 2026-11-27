import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_RUNTIME } from "../shared-spec-fragments"

const spec: HubSubcommandSpec = {
  label: "compact",
  description: "Checkpoint the session, then compact without losing decisions",
  reminder: "Checkpoint before compact, restore after.",
  inline: true,

  detailedDescription: `Compact the current session safely.

1. Call the \`runtime\` tool with action \`compact\` to trigger checkpoint-then-compact for the session.
2. The checkpoint captures active files, mode, quality, and a content digest so decisions survive compression.
3. After compaction, report what was preserved (mode, active files, key decisions) and confirm the session resumed cleanly.

Use when fill is high or quality is degrading and a fresh context window is needed without losing the thread.`,

  tools: TOOLS_RUNTIME,
  relatedSkills: ["vectorize-context"],
}

export default spec
