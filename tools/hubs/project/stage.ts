import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "stage",
  description: "Stage git changes from current conversation thread",
  reminder: "Stage files changed in conversation.",
  command: "git-stage-thread",

  detailedDescription: `Stages files that were changed during the current conversation thread. Scans the conversation for file edits/writes and stages exactly those files — not all modified files in the working tree.

This prevents accidentally staging unrelated changes (from other tools, manual edits, etc.). Use before /project commit to ensure only the conversation's changes are committed.`,

  tools: ["bash"],
  relatedSkills: [],
}

export default spec