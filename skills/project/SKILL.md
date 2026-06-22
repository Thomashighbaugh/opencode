---
name: project
description: Project operations hub — test creation, git workflows, code review, code refactoring, optimization, icons, and file organization
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
- Refactoring, simplifying, and modernizing code
- Cleaning up AI-generated code slop
- Generating icon assets
- Organizing files and finding duplicates
- Analyzing code patterns
- Generating changelogs

## No-Argument Behavior

When invoked without arguments, list the subcommands as plain text and ask the user to choose. Do NOT call `hubMenu` or any other tool — just output the list directly. Available operations: tests, commit, stage, pr, gh, optimize, refactor, simplify, cleanup, modernize, icon, organize, analyze, changelog, converge, scan, sandbox, retrospect, purge, git-cleanup.

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

### `/project create-tests` — Generate Test Suite

**Delegates to:** inline execution

Generate a comprehensive 8-type test suite for an OpenCode agent.

**Reminder:**
> Tests: Generate an 8-type test suite for an agent.

**Usage:** `/project create-tests <agent-name>`

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

**Delegates to:** `github-ops` skill

Create, view, merge, and manage GitHub pull requests via GitHub CLI.

**Reminder:**
> PR: Create, view, merge pull requests via GitHub CLI.

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

### `/project git-stage-thread` — Stage Thread Changes

**Delegates to:** inline execution

Stage files modified in the current conversation thread.

**Reminder:**
> Stage: Stage all files modified in this conversation thread.

**Usage:** `/project git-stage-thread`

---

### `/project optimize` — Code Optimization

**Delegates to:** inline execution

Analyze code for performance, security, and maintainability.

**Reminder:**
> Optimize: Analyze code for bottlenecks, vulnerabilities, and maintainability issues.

**Usage:** `/project optimize [file or directory paths]` — if no paths, analyze current context

---

### `/project refactor` — Code Refactoring

**Delegates to:** `@refactoring` agent

Restructure existing code without changing its behavior. Extracts functions, splits oversized modules, reduces coupling, and improves maintainability. The `@refactoring` agent plans the refactoring strategy and implements it step by step.

**Reminder:**
> Refactor: I'll plan and implement behavior-preserving code restructuring. Extract, split, reduce coupling, and clean up.

**Usage:**
- `/project refactor src/components/` — Refactor a directory
- `/project refactor src/utils.ts` — Refactor a specific file
- `/project refactor src/ --extract-module "validation"` — Extract a module

**Process:**
1. Analyze the target code for refactoring opportunities (long functions, high cyclomatic complexity, tight coupling, mixed concerns)
2. Present a refactoring plan with specific changes
3. Implement changes one at a time, verifying correctness after each
4. Run existing tests to confirm no behavior change

---

### `/project simplify` — Code Simplification

**Delegates to:** `@code-simplifier` agent

Reduce code complexity — flatten deeply nested conditionals, simplify complex expressions, clarify naming, eliminate redundant abstractions. Focuses on making code more readable and maintainable without changing its behavior.

**Reminder:**
> Simplify: I'll reduce complexity, flatten nesting, clarify naming, and remove unnecessary abstractions.

**Usage:**
- `/project simplify src/complex.ts` — Simplify a specific file
- `/project simplify src/ --max-complexity 5` — Simplify all files above a cyclomatic complexity threshold

**Process:**
1. Scan target code for complexity hotspots (deep nesting, long conditionals, high cyclomatic complexity)
2. For each hotspot, apply simplifications: guard clauses, early returns, decomposition, ternary reduction
3. Verify each change preserves behavior

---

### `/project cleanup` — Clean Up AI Slop

**Delegates to:** `ai-slop-cleaner` skill

Regression-safe cleanup of AI-generated code artifacts — dead code, unused exports, redundant comments, hallucinated imports, and boilerplate that doesn't belong. Uses the `ai-slop-cleaner` skill's deletion-first workflow: identify, verify unused, delete, confirm nothing broke.

**Reminder:**
> Cleanup: I'll safely remove AI-generated slop — dead code, unused exports, redundant comments — using deletion-first verification.

**Usage:**
- `/project cleanup src/` — Clean up a directory
- `/project cleanup --review-only` — Review-only mode, no deletions
- `/project cleanup src/app.ts` — Clean a specific file

**Process:**
1. Scan for AI slop patterns: unused exports, dead code paths, redundant JSDoc, hallucinated imports, empty catch blocks, tautological comments
2. For each finding, verify it's truly unused (cross-reference imports, usages, and call sites)
3. Delete or clean up with confirmation for ambiguous cases
4. Run tests to verify nothing broke

---

### `/project modernize` — Code Modernization

**Delegates to:** `@refactoring` agent

Update code patterns to modern language and framework conventions while preserving behavior. Examples: ES6+ syntax upgrades, framework API migrations, replacing deprecated patterns, adopting newer language features.

**Reminder:**
> Modernize: I'll update code patterns to modern language/framework conventions — behavior-preserving, targeted modernization.

**Usage:**
- `/project modernize src/` — Modernize all code in a directory
- `/project modernize src/ --target es2022` — Target specific language version
- `/project modernize --dry-run` — Preview changes without applying

**Process:**
1. Detect the target code's language version and patterns
2. Identify modernization opportunities (e.g., `var` → `const`/`let`, promise chains → async/await, class components → hooks, CommonJS → ESM)
3. Present the modernization plan with expected changes
4. Apply changes incrementally, running tests between batches

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

### `/project analyze-patterns` — Analyze Codebase Patterns

**Delegates to:** inline execution

Analyze codebase patterns and anti-patterns.

**Reminder:**
> Analyze: Scan codebase for patterns, anti-patterns, and architectural decisions.

**Usage:** `/project analyze-patterns [paths or scope]`

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

### `/project git-cleanup` — Fix Orphaned CHANGELOG Entries

**Delegates to:** inline execution

Repair CHANGELOG or `.opencode/CHANGELOG.md` files whose commit references no longer exist in git history. This happens when a project's `.git/` directory is rebuilt from remote (e.g., after `rm -rf .git && git clone`). The changelog entries themselves are valid — the work happened — but the commit hashes they reference are gone.

**Process:**
1. Read all `CHANGELOG.md` and `.opencode/CHANGELOG.md` files
2. Parse every entry for commit hash references (e.g., `` `abc1234` ``)
3. For each hash, run `git cat-file -t <hash>` to check if it exists in current history
4. Report entries with orphaned hashes — show the content that would be lost
5. **Option A — Replace hash with context**: `` `abc1234` `` → `[context: removed]`
6. **Option B — Replace hash with date/topic**: `` `abc1234` `` → `[2026-06-12]` (inferred from entry date)
7. **Option C — Leave hash but mark**: `` `abc1234` `` → `` `abc1234` `` (not in current history)
8. Default: Option B (most readable), confirm with user

**Reminder:**
> Git-cleanup: I'll scan CHANGELOG files for commit references that no longer exist in git history (common after .git/ rebuild), and repair them without losing the changelog content.

**Usage:**
- `/project git-cleanup` — Scan all changelogs, report orphaned refs, prompt for fix
- `/project git-cleanup --fix` — Auto-repair all orphaned refs with date-based replacements
- `/project git-cleanup --fix --option context` — Replace with [context: removed]
- `/project git-cleanup --check-only` — Just report, don't fix

---

## Related

- `/ideation` — Plan before you build
- `/orchestrate` — Execute with a pattern
- `/harvest-context` — Capture and manage project knowledge
- `/init-project` — Set up or refresh project configuration