import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "organize",
  description: "Find duplicates, suggest structures, automate cleanup",
  reminder: "Find duplicates and organize files.",
  skill: "file-organizer",

  detailedDescription: `Intelligently organizes files and folders. The file-organizer skill:

- Finds duplicate files (content-hash based, not name-based).
- Suggests better directory structures based on content analysis.
- Automates cleanup tasks (move, consolidate, archive).
- Understands context (a React component goes in components/, not utils/).

Use when the project's file structure has grown organically and needs organization. Especially useful after periods of rapid development where files landed in ad-hoc locations.`,

  tools: ["loadSkill", "bash"],
  relatedSkills: [],
}

export default spec