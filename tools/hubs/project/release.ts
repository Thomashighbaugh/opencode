import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "release",
  description: "Tag and release — bump version, generate changelog, create GitHub release in one flow",
  reminder: "Tag, bump, and create GitHub release.",
  inline: true,

  detailedDescription: `End-to-end release flow in one command:

1. Bump version (patch/minor/major per semver, or custom).
2. Generate changelog from commits since last release (via /project changelog logic).
3. Update version files (package.json, Cargo.toml, VERSION, etc.).
4. Commit the version bump.
5. Create a git tag.
6. Create a GitHub release with the changelog as release notes (via gh CLI).
7. Push tag and release commit.

Use when ready to release. Combines version bump + changelog + tag + GitHub release into a single flow.`,

  tools: ["bash"],
  relatedSkills: ["changelog-generator", "github-ops", "conventional-commit"],
}

export default spec