import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "context",
  description: "Manage context files — harvest, extract, organize, compact, map",
  reminder: "Harvest, organize, or compact context.",
  inline: true,

  detailedDescription: `Manages .opencode/context/ files. Operations:

- harvest: scan context files and identify what's stale, redundant, or missing.
- extract: pull key information from large context files into smaller, focused ones.
- organize: restructure context files into the correct subdirectories (frameworks/, patterns/, research/, decisions.md).
- compact: merge related small context files into consolidated ones to reduce file count.
- map: produce a map of what context exists and where, for quick reference.

Use for context maintenance — keeping .opencode/context/ healthy and navigable.`,

  tools: ["bash"],
  rules: ["context-strategy"],
  relatedSkills: ["compact"],
}

export default spec