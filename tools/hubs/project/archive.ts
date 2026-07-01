import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "archive",
  description: "Move stale branches, old artifacts, unused config to timestamped archive — keep working tree clean",
  reminder: "Archive stale branches and artifacts.",
  inline: true,

  detailedDescription: `Archives stale items to keep the working tree clean. Moves:

- Stale git branches (merged or abandoned) to an archive ref.
- Old build artifacts to a timestamped archive directory.
- Unused config files to an archive folder.
- Superseded documentation.

Archive is non-destructive — items are moved, not deleted, and can be recovered. Use when the repo accumulates cruft that makes navigation harder.`,

  tools: ["bash"],
  relatedSkills: [],
}

export default spec