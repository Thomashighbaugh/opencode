import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "pwf",
  description: "Planning-with-files — treat filesystem as disk, context window as RAM; three-file pattern with quality-gated convergence and session recovery",
  reminder: "Plan with files as persistent disk.",
  inline: true,

  detailedDescription: `Planning-with-files methodology: treats the filesystem as persistent disk and the context window as RAM. A three-file pattern:

1. plan.md: the evolving plan. Read at the start of each session, written at the end. Survives context compaction.
2. progress.md: what's done, what's in progress, what's blocked. Updated continuously.
3. decisions.md: key decisions made and their rationale. Append-only.

The quality-gated convergence ensures the plan isn't considered done until quality criteria pass. Session recovery means a new session can resume by reading the three files — no context window dependency.

Use for long-running, multi-session work where context will compact or sessions will restart. The files are the source of truth, not the context window. This aligns with the durable context strategy (.opencode/context/).`,

  tools: ["bash"],
  rules: ["context-strategy"],
  relatedSkills: [],
}

export default spec