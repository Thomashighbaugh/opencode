# Git Workflow Rules

## Commit Message Format

```
<type>: <description>

<optional body>
```

Types: feat, fix, refactor, docs, test, chore, perf, ci

## Pull Request Workflow

When creating PRs:
1. Analyze full commit history (not just latest commit)
2. Use `git diff [base-branch]...HEAD` to see all changes
3. Draft comprehensive PR summary
4. Include test plan with TODOs
5. Push with `-u` flag if new branch

## Feature Implementation Workflow

Use judgment for workflow complexity:
- **Trivial changes** (typo, single-line fix): implement directly, commit
- **Standard changes**: plan → implement → review → commit
- **Complex features**: plan → TDD → implement → review → commit

Agent delegation is optional — use only when the task complexity warrants it.

## Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation changes

## [CUSTOMIZE] Project-Specific Git Rules

Add your project-specific git workflow here:
- Branch protection rules
- Required reviewers
- CI/CD requirements
