---
name: project
description: Project operations hub — test creation, git workflows, code review, optimization, icons, and file organization
level: 2
---

# Project

Unified entry point for project operations. Each subcommand delegates to an existing command or skill, with shared behavior for argument parsing and state awareness.

## When to Use

- Creating tests for an agent
- Committing, staging, or managing git operations
- Creating or managing pull requests
- Reviewing code quality, security, and architecture
- Analyzing or optimizing code
- Generating icon assets
- Organizing files and finding duplicates
- Analyzing code patterns
- Generating changelogs

## No-Argument Behavior

When invoked without arguments, list the subcommands as plain text and ask the user to choose. Do NOT call `hubMenu` or any other tool — just output the list directly. Available operations: tests, commit, stage, pr, gh, optimize, icon, organize, analyze, changelog, converge, scan, sandbox, retrospect, purge.

## With-Argument Behavior

Directly invoke the matching subcommand. Print the reminder, then delegate.

## Subcommands

### `/project tests` — Generate Test Suite

**Delegates to:** `create-tests` command

Generate a comprehensive 8-type test suite for an OpenCode agent.

**Reminder:**
> Tests: Generate an 8-type test suite (planning, context-loading, implementation, delegation, error-handling, multi-language, coder-delegation, completion) for an agent.

**Usage:** `/project tests <agent-name>`

---

### `/project commit` — Create Git Commit

**Delegates to:** `conventional-commit` skill / `commit` command

Create a well-formatted git commit with conventional commit messages and emoji.

**Reminder:**
> Commit: Create a conventional commit with emoji prefixes. I'll analyze staged changes and generate an appropriate message.

**Usage:** `/project commit [message]` — if message provided, use it; otherwise analyze diff

---

### `/project stage` — Stage Changes

**Delegates to:** `git-stage-thread` command

Stage git changes for files modified in the current conversation thread.

**Reminder:**
> Stage: I'll identify all files modified in our conversation and stage them for commit.

**Usage:** `/project stage`

---

### `/project review` — Code Review

**Delegates to:** `code-reviewer` agent

Perform focused code review detecting smells and deep-diving concerns across security, performance, architecture, and code quality.

**Reminder:**
> Review: Focused code review — I'll detect smells, prioritize concerns, and deep-dive the top issues.

**Usage:**
- `/project review` — Review changes on current branch (git diff)
- `/project review src/` — Review specific paths
- `/project review --security` — Security-focused review

---

### `/project pr` — Pull Request Operations

**Delegates to:** `pr` command

Create, view, merge, and manage GitHub pull requests.

**Reminder:**
> PR: Pull request operations — create, view, diff, merge, list, or check status.

**Usage:**
- `/project pr create` — Create new PR from current branch
- `/project pr view <number>` — View PR details
- `/project pr diff <number>` — Show PR diff
- `/project pr merge <number>` — Merge a PR
- `/project pr list` — List open PRs
- `/project pr checks <number>` — View PR status checks

---

### `/project gh` — GitHub Operations

**Delegates to:** `github-ops` skill

Full GitHub CLI operations — repos, issues, releases, workflows, code search.

**Reminder:**
> GH: Full GitHub operations via the gh CLI. Repo, issue, PR, actions, releases, and search.

**Usage:** `/project gh <operation>` — e.g., `repo view cli/cli`, `issue list`, `release create v1.0.0`

---

### `/project optimize` — Code Optimization

**Delegates to:** `optimize` command

Analyze code for performance issues, security vulnerabilities, and maintainability problems.

**Reminder:**
> Optimize: Analyze code for performance bottlenecks, security vulnerabilities, and maintainability. I'll provide a prioritized report with fixes.

**Usage:** `/project optimize [file or directory paths]` — if no paths, analyze current context

---

### `/project icon` — Generate Icon Assets

**Delegates to:** `icon-generator` skill

Generate all required icon sizes and formats (favicon, PWA, apple-touch, Unreal Engine) from a single SVG or PNG source.

**Reminder:**
> Icon: Generate web/PWA/UE icon assets from a source image. I'll produce all sizes and formats plus HTML snippets.

**Usage:**
- `/project icon logo.svg` — Generate all icon formats
- `/project icon logo.svg --web-only` — Web icons only
- `/project icon logo.svg --pwa-only` — PWA icons only

---

### `/project organize` — File Organization

**Delegates to:** `file-organizer` skill

Organize files and folders — find duplicates, suggest structures, automate cleanup.

**Reminder:**
> Organize: Scan directories, find duplicates, suggest structures, and clean up files. Preview before executing.

**Usage:**
- `/project organize ~/Downloads` — Organize a directory
- `/project organize --duplicates` — Find duplicate files
- `/project organize --structure` — Suggest better organization
- `/project organize --stats` — Show directory statistics

---

### `/project analyze` — Pattern Analysis

**Delegates to:** `analyze-patterns` command

Analyze code patterns, architectural decisions, and codebase structure.

**Reminder:**
> Analyze: Scan the codebase for patterns, anti-patterns, and architectural decisions. I'll provide a structured analysis.

**Usage:** `/project analyze [paths or scope]`

---

### `/project changelog` — Generate Changelog

**Delegates to:** `changelog-generator` skill

Generate user-facing changelogs from git commits.

**Reminder:**
> Changelog: Generate a user-facing changelog from git commits. I'll categorize changes and translate technical jargon into customer language.

**Usage:**
- `/project changelog` — Since last git tag
- `/project changelog since v1.5.0` — Since specific version
- `/project changelog last week` — Last 7 days
- `/project changelog 2024-01-01..2024-01-31` — Date range

---

## Post-Execution Suggestions

After execution, offer next steps based on context:
- After `commit` → offer `stage` or `pr`
- After `stage` → offer `commit`
- After `review` → offer `commit` to fix issues found, or `pr` if changes are ready
- After `tests` → offer `commit` to commit the test files
- After `optimize` → offer `commit` to commit fixes
- After any git operation → offer related git operations

## Related

- `/ideation` — Plan before you build
- `/orchestrate` — Execute with a pattern
- `/harvest-context` — Capture and manage project knowledge
- `/init-project` — Set up or refresh project configuration