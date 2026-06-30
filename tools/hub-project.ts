import { HubDefinition } from "./hub-data"

const hub: HubDefinition = {
  name: "project",
  description: "Project operations hub — tests, git workflows, code refactoring, optimization, icons, changelogs, and file organization",
  stateDir: "",
  subcommands: [
    { label: "tests", description: "Generate comprehensive 8-type test suite", command: "create-tests", reminder: "Generate comprehensive 8-type test suite." },
    { label: "commit", description: "Create well-formatted conventional commit", skill: "conventional-commit", reminder: "Create conventional commit with staged changes." },
    { label: "stage", description: "Stage git changes from current conversation thread", command: "git-stage-thread", reminder: "Stage files changed in conversation." },
    { label: "pr", description: "Create, view, merge, or manage pull requests", command: "pr", reminder: "Manage pull requests via GitHub CLI." },
    { label: "gh", description: "Full GitHub CLI operations via gh", skill: "github-ops", reminder: "Run GitHub CLI operations." },
    { label: "optimize", description: "Analyze and optimize code for performance/security", command: "optimize", reminder: "Optimize code performance and security." },
    { label: "refactor", description: "Restructure code without changing behavior — extract functions, split modules, reduce coupling via @refactoring agent", agent: "refactoring", reminder: "Restructure code without changing behavior." },
    { label: "simplify", description: "Reduce code complexity — flatten nesting, simplify conditionals, clarify naming via @code-simplifier agent", agent: "code-simplifier", reminder: "Reduce code complexity and improve clarity." },
    { label: "cleanup", description: "Regression-safe cleanup of AI-generated slop — dead code, redundant comments, unused exports via ai-slop-cleaner skill", skill: "ai-slop-cleaner", reminder: "Clean up AI-generated code slop safely." },
    { label: "modernize", description: "Update code patterns to modern language/framework conventions — targeted, behavior-preserving modernization via @refactoring agent", agent: "refactoring", reminder: "Modernize code patterns and conventions." },
    { label: "icon", description: "Generate web/PWA/UE icon assets from source image", skill: "icon-generator", reminder: "Generate icon assets from source image." },
    { label: "organize", description: "Find duplicates, suggest structures, automate cleanup", skill: "file-organizer", reminder: "Find duplicates and organize files." },
    { label: "analyze", description: "Analyze code patterns in the codebase", command: "analyze-patterns", reminder: "Analyze codebase patterns and anti-patterns." },
    { label: "changelog", description: "Generate user-facing changelog from git commits", skill: "changelog-generator", reminder: "Generate changelog from git commits." },
    { label: "converge", description: "5-gate quality convergence — functional tests, lint/complexity, type safety, security scanning, performance thresholds with progressive target escalation", inline: true, reminder: "Run 5-gate quality convergence." },
    { label: "scan", description: "Security vulnerability scan — SAST rules, secrets detection, dependency audit, compliance checks", inline: true, reminder: "Run security vulnerability scan." },
    { label: "sandbox", description: "Sandbox enforcement — policy-based tool control, file protection, network filtering for agent tool calls", inline: true, reminder: "Enforce sandbox tool execution policies." },
    { label: "retrospect", description: "Post-run retrospective analysis — extract lessons learned, error taxonomy classification, metrics across all phases", inline: true, reminder: "Run post-run retrospective analysis." },
    { label: "purge", description: "Clean up stale orchestration state — remove old runs, free disk space, preserve recent history", inline: true, reminder: "Purge stale orchestration state." },
    { label: "release", description: "Tag and release — bump version, generate changelog, create GitHub release in one flow", inline: true, reminder: "Tag, bump, and create GitHub release." },
    { label: "review", description: "Full code review round — analyze recent changes, run security scan, check complexity, produce a review report", inline: true, reminder: "Run full code review round." },
    { label: "audit", description: "Comprehensive project health check — dependencies, security, code quality, test coverage, bundle size in one command", inline: true, reminder: "Run comprehensive project health audit." },
    { label: "archive", description: "Move stale branches, old artifacts, unused config to timestamped archive — keep working tree clean", inline: true, reminder: "Archive stale branches and artifacts." },
    { label: "git-cleanup", description: "Fix orphaned CHANGELOG entries referencing commits not in git history after .git/ rebuild — preserves entries, removes bad refs", inline: true, reminder: "Clean up orphaned commit references in CHANGELOG." },
    { label: "workspace", description: "Manage .opencode across projects — list Hubs-enabled projects, sync config, init .opencode in new directories, check health", inline: true, reminder: "Manage Hubs workspace across projects." },
    { label: "readme", description: "Update README to reflect current codebase state — scans agents, skills, tools, rules, commands; preserves tone, links, and structure; SEO-optimized output via readme-updater skill", skill: "readme-updater", reminder: "Update README with current codebase state." }
  ]
}

export default hub
