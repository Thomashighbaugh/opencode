import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "gh",
  description: "Full GitHub CLI operations via gh",
  reminder: "Run GitHub CLI operations.",
  skill: "github-ops",

  detailedDescription: `Full GitHub CLI operations via the github-ops skill. Covers any gh CLI command: issues, releases, actions, secrets, repos, teams, gists, codespaces, etc.

The skill knows the correct gh command syntax for common operations and can draft exact commands for complex queries. Use instead of webfetch for any github.com URL — gh has authenticated access and structured output.

Common operations: issue management, release creation, workflow monitoring, secret management, repo settings, team management.`,

  tools: ["loadSkill", "bash"],
  relatedSkills: [],
}

export default spec