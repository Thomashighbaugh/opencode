import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "find-skills",
  description: "Discover skills relevant to the current project by searching across skill registries (skills.sh, GitHub) — fetches candidates, security-scans top results, presents recommendations for installation. Used by setup/refresh to find per-repo skills",
  reminder: "Search registries for relevant project skills.",
  skill: "find-skills",

  detailedDescription: `Discovers skills relevant to the current project by searching across skill registries simultaneously. Sources:

- skills.sh registry
- clawhub.ai
- GitHub (repos tagged as opencode-skills)

Process:
1. Search all registries in parallel for skills matching the project's stack and needs.
2. Security-scan top results (check for dangerous patterns, secrets, suspicious code).
3. Present ranked recommendations with descriptions, source reputation, and security scan results.
4. User selects which to install; the skill installs them to the appropriate scope.

Use during /init-project setup/refresh or standalone when you want to extend the project's skill set with community skills.`,

  tools: ["loadSkill", "bash"],
  relatedSkills: ["find-agents", "find-tools"],
}

export default spec