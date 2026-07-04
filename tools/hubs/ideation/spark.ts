import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "spark",
  description: "Project-aware idea spark — improvements & expansions in short, expandable prompts",
  reminder: "Spark project-aware improvement and expansion ideas.",
  inline: true,

  detailedDescription: `Generates short, high-signal idea sparks anchored in the actual project. Unlike /ideation brainstorm (free-form, no codebase awareness), spark first scans the project for concrete surfaces to improve or expand, then produces a structured output of short prompts — each just enough to ignite further exploration.

Process:
1. Optionally accept a user-provided area or theme to focus on (e.g. "performance", "api design", "ux"). If none given, scan broadly.
2. Scan the project: read top-level structure, package.json/Cargo.toml/etc., key source directories, existing agents/skills/tools/rules. Identify patterns, gaps, rough edges, and growth vectors.
3. Split output into two sections — IMPROVEMENTS (refine what exists) and EXPANSIONS (add new capability). Each item is a short 1-2 sentence prompt — not a spec, not a plan, just a spark.
4. Output as a markdown table with columns: Area, Spark, Effort (S/M/L). Optionally also as an unordered list if the user prefers list format.
5. Save to .opencode/state/ideation/work-products/{timestamp}_spark_{theme}.md

Each spark should be concrete enough to be actionable but open enough to explore: "Add retry with exponential backoff to the API client's fetch calls" not just "improve error handling". Use when you know the project has potential but don't know where to start iterating — the output feeds directly into /ideation plan, /ideation decompose, or /ideation refine.`,

  tools: ["bash", "glob", "grep", "read"],
  relatedSkills: [],
}

export default spec
