import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "resume",
  description: "Resume last orchestration session",
  reminder: "Resume last orchestration session.",
  inline: true,

  detailedDescription: `Resumes the most recent orchestration session from its checkpoint. Loads the checkpoint from .opencode/state/orchestration/ and continues the workflow from where it left off.

Each orchestration pattern that supports resume writes checkpoints during execution. The checkpoint includes: current phase, completed tasks, remaining tasks, and any intermediate state. On resume, the orchestrator reads the checkpoint and picks up from the last completed step.

Use when a previous /orchestrate invocation was interrupted (session ended, crashed, or you manually stopped it) and you want to continue without losing progress.`,

  tools: ["bash", "modeState"],
  relatedSkills: [],
}

export default spec