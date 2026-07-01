import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "sync",
  description: "Sync skills between user and project scopes — scan both, categorize, display diff opportunities, copy or merge with confirmation",
  reminder: "Sync skills across user and project scopes.",
  inline: true,

  detailedDescription: `Syncs skills between user scope (~/.config/opencode/skills/omc-learned/) and project scope (.opencode/state/skills/). Process:

1. Scan both scopes.
2. Categorize: skills only in user, only in project, in both.
3. For skills in both: show diff (are they identical or different versions?).
4. Offer to copy or merge with confirmation.

Use when you want to propagate a skill from user scope to a project (or vice versa), or reconcile differences between scopes.`,

  tools: ["bash"],
  relatedSkills: [],
}

export default spec