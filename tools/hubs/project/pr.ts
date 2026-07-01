import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "pr",
  description: "Create, view, merge, or manage pull requests",
  reminder: "Manage pull requests via GitHub CLI.",
  command: "pr",

  detailedDescription: `Manages pull requests via the GitHub CLI (gh). Operations:

- Create: open a PR from the current branch to the base branch, with title, body, labels, reviewers.
- View: show PR details, diff, checks, reviews.
- List: list open PRs.
- Merge: merge a PR (merge, squash, or rebase strategy).
- Checks: view CI check status for a PR.
- Review: submit a review (approve, request changes, comment).

Always uses gh CLI (never raw git push + GitHub API). Use for any PR operation without leaving the session.`,

  tools: ["bash"],
  relatedSkills: ["github-ops"],
}

export default spec