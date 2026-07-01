import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "quality",
  description: "Deep-dive code quality audit — complexity hotspots, duplication clusters, naming violations, error handling gaps across the codebase",
  reminder: "Deep-dive code quality analysis across the codebase.",
  inline: true,

  detailedDescription: `Deep-dive code quality audit across the entire codebase. Scans for:

- Complexity hotspots: functions/modules with high cyclomatic complexity.
- Duplication clusters: repeated code blocks that should be extracted.
- Naming violations: inconsistent or unclear naming patterns.
- Error handling gaps: swallowed errors, missing error cases, generic catches.
- Dead code: unreachable or unused code.

Each finding is classified by severity and location. The output is a prioritized audit report: critical issues first, then warnings, then suggestions. Each issue includes its file/line location and a recommended fix.

Use for brownfield codebases that need a quality baseline before improvement work. The audit identifies what to fix and in what order. Pairs well with /ideation overhaul (which produces a phased improvement plan from the audit).`,

  tools: ["bash"],
  relatedSkills: ["ai-slop-cleaner"],
}

export default spec