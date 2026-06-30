import { HubDefinition } from "./hub-data"

const hub: HubDefinition = {
  name: "init-project",
  description: "Initialize or refine project setup",
  stateDir: "init",
  subcommands: [
    { label: "setup", description: "Full project setup — global Hubs verify, detection, scaffold, provision agents/tools, docs, context, routing, verify", skill: "init-project", reminder: "Full project init: verify, detect, scaffold, docs, validate.", phases: "0-8" },
    { label: "detect", description: "Deep stack detection — analyze codebase for languages, frameworks, build tools, testing, ORM, CSS, CI/CD, etc. via @stack-detector agent", agent: "stack-detector", reminder: "Detect full tech stack via @stack-detector agent.", phases: "0-1" },
    { label: "recommend", description: "Recommend global resources for detected stack — maps stack fingerprint to relevant skills, agents, rules, and archetype via stack-recommender skill", skill: "stack-recommender", reminder: "Recommend global resources matching the detected stack." },
    { label: "docs", description: "Generate hierarchical AGENTS.md documentation across the codebase", skill: "deepinit", reminder: "Generate hierarchical AGENTS.md documentation.", phases: "4" },
    { label: "context", description: "Capture session knowledge, promote insights to project memory and docs", skill: "remember", reminder: "Capture session knowledge for project memory.", phases: "5" },
    { label: "verify", description: "Validate configuration completeness, file existence, and reference integrity", agent: "verifier", reminder: "Validate configuration completeness and integrity.", phases: "7" },
    { label: "refresh", description: "Update existing configuration — preserve manual edits, merge new detections, rerun recommend+provision", skill: "init-project", reminder: "Update config preserving manual edits.", phases: "0-8 (merge)" },
    { label: "status", description: "Show current initialization state and checkpoint progress", inline: true, reminder: "Show init state and checkpoint progress." },
    { label: "map-codebase", description: "Analyze existing brownfield codebase — spawn parallel agents to map stack, architecture, conventions, and integration points before init", inline: true, reminder: "Map codebase via parallel agent analysis." },
    { label: "doctor", description: "Run diagnostic health check — validate Hubs installation, config integrity, state consistency, and hook status", inline: true, reminder: "Run Hubs health diagnostics." },
    { label: "reset", description: "Reset project state — archive .opencode/state and .opencode/context, start fresh with clean slate", inline: true, reminder: "Reset project state with clean slate." },
    { label: "provision", description: "Provision project config via project-config-composer — auto-generate .opencode/opencode.jsonc, project rules, and agent wrappers from stack fingerprint + recommendations", skill: "project-config-composer", reminder: "Auto-generate .opencode/ config from stack analysis." },
    { label: "tag", description: "Audit and fix resource tags on global skills, agents, rules, and archetypes for resource_tags filtering — scan, classify, suggest, and apply tags via tag-resources skill", skill: "tag-resources", reminder: "Audit and fix resource tags for filtering." },
    { label: "find-skills", description: "Discover skills relevant to the current project by searching across skill registries (skills.sh, GitHub) — fetches candidates, security-scans top results, presents recommendations for installation. Used by setup/refresh to find per-repo skills", skill: "find-skills", reminder: "Search registries for relevant project skills." },
    { label: "find-agents", description: "Discover agents relevant to the current project by searching across agent registries and GitHub — finds specialized subagents for detected tech stack. Used by setup/refresh to find per-repo agents", skill: "find-agents", reminder: "Search registries for relevant project agents." },
    { label: "find-tools", description: "Discover TypeScript tools relevant to the current project by searching registries (GitHub, npm) and local template catalog — finds project-specific automation tools. Used by setup/refresh to find per-repo tools", skill: "find-tools", reminder: "Search registries for relevant project tools." },
    { label: "find-rules", description: "Discover OpenCode rules relevant to the current project by searching registries (GitHub, skills.sh) and local template catalog — finds project-specific conventions and guidelines. Used by setup/refresh to find per-repo rules", skill: "find-rules", reminder: "Search registries for relevant project rules." }
  ]
}

export default hub
