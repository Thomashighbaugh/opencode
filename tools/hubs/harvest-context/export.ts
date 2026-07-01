import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "export",
  description: "Export context as a readable summary, markdown bundle, or team report — share what the project knows",
  reminder: "Export context as readable summary.",
  inline: true,

  detailedDescription: `Exports durable context in a shareable format. Options:

- Summary: a readable markdown summary of key decisions, patterns, and research — good for onboarding.
- Bundle: a single markdown file containing all context files concatenated — good for sharing with another agent or tool.
- Team report: a structured report organized by topic (architecture, decisions, patterns, research) — good for stakeholder communication.

The export is saved to .opencode/state/harvest/ or printed. Sensitive data is stripped before export (privacy scan runs first).

Use when you need to share project knowledge with someone outside the OpenCode workflow — a new team member, a stakeholder, or a different tool.`,

  tools: ["bash"],
  rules: ["security"],
  relatedSkills: ["privacy-scan"],
}

export default spec