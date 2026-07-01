import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "changelog",
  description: "Generate user-facing changelog from git commits",
  reminder: "Generate changelog from git commits.",
  skill: "changelog-generator",

  detailedDescription: `Generates a user-facing changelog from git commit history. The changelog-generator skill:

1. Analyzes commit history (conventional commits or free-form).
2. Categorizes changes: features, fixes, breaking changes, improvements, etc.
3. Transforms technical commit messages into clear, customer-friendly release notes.
4. Groups by version or date range.

Output: a markdown changelog ready for release. Use before a release to produce the release notes, or periodically to document progress.`,

  tools: ["loadSkill", "bash"],
  relatedSkills: [],
}

export default spec