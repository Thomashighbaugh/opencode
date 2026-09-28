import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_BASH, RULES_CONTEXT_STRATEGY } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "context",
  description: "Manage context files — harvest, extract, organize, compact, map — updates wiki index/log on changes",
  reminder: "Harvest, organize, or compact context.",
  inline: true,

  detailedDescription: `Manages .opencode/context/ files. Operations:

- harvest: scan context files and identify what's stale, redundant, or missing.
- extract: pull key information from large context files into smaller, focused ones.
- organize: restructure context files into the correct subdirectories (frameworks/, patterns/, research/, decisions.md).
- compact: merge related small context files into consolidated ones to reduce file count.
- map: produce a map of what context exists and where, for quick reference.

**Wiki compliance**: after any restructuring (organize, compact, extract), update .opencode/context/index.md (catalog), append to .opencode/context/log.md, ensure YAML frontmatter on all files, scan for broken cross-references.

Use for context maintenance — keeping .opencode/context/ healthy and navigable.`,

  tools: TOOLS_BASH,
  rules: RULES_CONTEXT_STRATEGY,
  relatedSkills: ["compact", "wiki"],
}

export default spec
