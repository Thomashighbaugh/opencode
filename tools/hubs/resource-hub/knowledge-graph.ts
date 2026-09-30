import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_LOADSKILL_BASH, RULES_KARPAHTY_GUIDELINES } from "../shared-spec-fragments"

const spec: HubSubcommandSpec = {
  label: "graph",
  description: "Per-project entity graph with vector-then-graph retrieval",
  reminder: "Build/query the project knowledge graph.",
  skill: "graph-context",

  detailedDescription: `Builds and queries the per-project knowledge graph — a sqlite store (.opencode/state/vector/graph.db) of knowledge entities (patterns, decisions, concepts, learnings, rules, skills, hub-subcommands) connected by typed edges (applies_to, supersedes, touches, related_to, part_of, used_by, derived_from).

Load the \`graph-context\` skill and run its CLI:

**Build (backfill):**
\`\`\`
node skills/graph-context/scripts/graph.ts build
\`\`\`
Idempotent, mtime-lazy. Sources: wiki pages (.opencode/context/**), learnings (.opencode/context/learnings/**), rules, skill manifests, and spec-registry.json (hub-subcommand nodes + used_by edges). Run after /harvest-context, /maintain-hub consolidate-telemetry, or learnings capture to fold new knowledge in.

**Hybrid query (vector recall → graph refine):**
\`\`\`
node skills/graph-context/scripts/graph.ts query "what is the caching strategy?"
\`\`\`
Two-stage: vector top-K candidates → BFS depth-2 graph refinement (decaying score) → merged ranked list tagged kind=vector|graph with the connecting edge type.

**Navigation:**
\`\`\`
node skills/graph-context/scripts/graph.ts neighbors <node-id>      # traverse edges
node skills/graph-context/scripts/graph.ts impact <node-id>        # what depends on this (impact analysis before editing config assets)
node skills/graph-context/scripts/graph.ts path <from> <to>        # BFS shortest path
node skills/graph-context/scripts/graph.ts stats                   # counts by type/edge
node skills/graph-context/scripts/graph.ts probe                   # precision probe vs vector-only
\`\`\`

Node id convention: {type}:{slug-or-path}, e.g. pattern:context-strategy, hub-subcommand:project/self-improve.

**Validation commands:**
- \`node skills/graph-context/scripts/graph.ts stats\` — graph exists with counts
- \`node skills/graph-context/scripts/graph.ts query "<known phrase>"\` — spot-check retrieval
- \`node skills/graph-context/scripts/graph.ts probe\` — precision probe vs baseline

See the \`graph-context\` skill for the full schema, workflow, and design constraints. Related: \`vectorize-context\` (sibling vector store), \`self-improvement\` (learnings → edges), \`graph-thinking\` (model).`,

  tools: TOOLS_LOADSKILL_BASH,
  rules: RULES_KARPAHTY_GUIDELINES,
  relatedSkills: ["vectorize-context", "self-improvement", "graph-thinking"],
  examples: [
    { input: "what touches the session-memory skill?", approach: "/project graph — build, then query 'session memory' or neighbors skill:session-memory to see used_by/related edges" },
    { input: "what breaks if I edit rule:context-strategy?", approach: "/project graph — impact rule:context-strategy shows all hub subcommands and skills that reference it" },
  ],
  warnings: [
    "Wiki markdown stays canonical — never hand-edit graph.db",
    "Run graph build after harvest/consolidate/learnings to keep the graph fresh",
    "Query path never throws — empty graph degrades to vector-only results",
  ],
}

export default spec
