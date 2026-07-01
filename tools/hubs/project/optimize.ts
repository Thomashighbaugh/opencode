import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "optimize",
  description: "Analyze and optimize code for performance/security",
  reminder: "Optimize code performance and security.",
  command: "optimize",

  detailedDescription: `Analyzes code for performance and security issues and applies optimizations. Scans for:

- Performance: N+1 queries, unnecessary allocations, missing indexes, O(n²) loops, redundant work.
- Security: injection vectors, auth bypass, secret exposure, unsafe deserialization.

For each finding, the optimizer proposes a fix and applies it. Changes are surgical — only the optimization, no refactoring theater.

Use when code is slow or has known security gaps. For pure security review without changes, use /project scan instead.`,

  tools: ["bash"],
  rules: ["security"],
  relatedSkills: [],
}

export default spec