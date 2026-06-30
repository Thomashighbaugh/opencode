import { HubDefinition } from "./hub-data"

const hub: HubDefinition = {
  name: "skills",
  description: "Skill manager — CRUD, search, sync, package, and validate OpenCode skills across user, project, and built-in scopes",
  stateDir: "",
  subcommands: [
    { label: "list", description: "List all available skills organized by scope — built-in, user (~/.config/opencode/skills/omc-learned/), and project (.opencode/state/skills/) — parse frontmatter, show quality/usage stats", inline: true, reminder: "List all skills by scope with metadata." },
    { label: "add", description: "Interactive wizard for quick skill creation — prompts for name, description, triggers, scope (user or project), writes SKILL.md with frontmatter", inline: true, reminder: "Quick-add a skill via interactive wizard." },
    { label: "create", description: "Full skill creation workflow with bundled resources — gather requirements, plan scripts/references/assets, run skill-creator workflow, package if ready", skill: "skill-creator", reminder: "Full skill creation with bundled resources." },
    { label: "remove", description: "Remove a skill by name — searches user and project scopes, confirms before deleting, warns if not found", inline: true, reminder: "Delete a skill after confirmation." },
    { label: "edit", description: "Edit an existing skill interactively — find by name, display current values, change description/triggers/content/rename, write back", inline: true, reminder: "Edit skill metadata or content interactively." },
    { label: "search", description: "Search skills by content, triggers, name, or description — case-insensitive matching across all scopes, ranked by relevance", inline: true, reminder: "Search skills by name, triggers, or content." },
    { label: "info", description: "Show detailed information about a skill — find by name, parse YAML frontmatter, display complete details and full content", inline: true, reminder: "Show full skill details and content." },
    { label: "update", description: "Update an existing skill using skill-creator iteration workflow — read current skill, identify improvements, apply changes, validate structure", inline: true, reminder: "Update skill content and resources." },
    { label: "package", description: "Package a skill for distribution — validate structure, create distributable zip if validation passes", inline: true, reminder: "Validate and package skill for distribution." },
    { label: "validate", description: "Validate a skill's structure without packaging — run structure checks, report errors, suggest fixes", inline: true, reminder: "Validate skill structure and metadata." },
    { label: "sync", description: "Sync skills between user and project scopes — scan both, categorize, display diff opportunities, copy or merge with confirmation", inline: true, reminder: "Sync skills across user and project scopes." },
    { label: "setup", description: "Interactive setup wizard — create skill directories, scan inventory, offer actions (add, list, scan conversation, import, done)", inline: true, reminder: "Set up skill directories and inventory." },
    { label: "scan", description: "Quick scan of skill directories — non-interactive inventory of both user and project scopes, reports counts and paths", inline: true, reminder: "Quick inventory scan of all skill directories." }
  ]
}

export default hub
