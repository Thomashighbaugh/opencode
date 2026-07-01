import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "sweep",
  description: "Scan .opencode/ for files that should be gitignored but aren't — prevents bloat that breaks git push",
  reminder: "Sweep .opencode/ for gitignore violations.",
  inline: true,

  detailedDescription: `Scans .opencode/ for files that should be gitignored but aren't. Checks:

- State files (.opencode/state/) — should be gitignored (ephemeral, may contain secrets).
- Cache files (.opencode/cache/) — should be gitignored.
- Session files — should be gitignored (may contain PII).
- Large files that would bloat the repo.
- Files matching secret patterns (API keys, tokens).

For each violation, the agent recommends adding a .gitignore entry. The user confirms before modifying .gitignore.

Use periodically to prevent .opencode/ bloat from breaking git push — a common issue when state files accumulate and exceed GitHub's file size limits.`,

  tools: ["bash"],
  rules: ["security", "context-strategy"],
  relatedSkills: ["privacy-scan"],
}

export default spec