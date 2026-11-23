import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "impeccable-audit",
  description: "Technical quality report: a11y, perf, responsive (impeccable audit)",
  reminder: "Runs impeccable audit against the target.",
  inline: true,

  detailedDescription: `Runs \`impeccable audit <target>\` via the impeccable skill launcher to produce a technical quality report covering accessibility, performance, theming, and responsive behavior, with findings ranked P0 (blocking) to P3 (polish). Pass a target path as the argument. See reference/audit.md in skills/impeccable/reference/.`,

  tools: ["read", "bash", "agentContext"],
  rules: ["antislop", "antislop-liveliness", "file-operations"],
  relatedSkills: ["impeccable"],
}

export default spec
