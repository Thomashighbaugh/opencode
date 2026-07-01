import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "doctor",
  description: "Run diagnostic health check — validate Hubs installation, config integrity, state consistency, and hook status",
  reminder: "Run Hubs health diagnostics.",
  inline: true,

  detailedDescription: `Runs a comprehensive diagnostic health check on the Hubs installation. Validates:

- Global config directory exists and has expected structure.
- opencode.jsonc is valid and references resolve.
- All agent files exist and have valid frontmatter.
- All skill files exist with valid SKILL.md.
- All tool files compile/resolve.
- State directories are consistent.
- Hook system is installed and functional.
- Plugin system is configured.

Output: a diagnostic report with pass/warn/fail per check and specific remediation instructions for failures. Use when something isn't working or after manual config changes.`,

  tools: ["bash"],
  relatedSkills: ["hubs-doctor"],
}

export default spec