import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "status",
  description: "Show current orchestration state",
  reminder: "Show orchestration state.",
  inline: true,

  detailedDescription: `Shows the current state of the orchestration hub: active sessions, checkpoints, state files, and their modification times. Read-only — does not modify any state.

Use to check what orchestration sessions exist, whether any are resumable, and what state files are present before starting a new session or resuming an existing one.`,

  tools: ["bash"],
  relatedSkills: [],
}

export default spec