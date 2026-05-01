---
description: "Project operations hub — tests, git workflows, optimization, icons, changelogs, and file organization"
invoke: project
argument-hint: "[tests|commit|stage|pr|gh|optimize|icon|organize|analyze|changelog] [args]"
---

# Project

Unified entry point for project operations. Test generation, git workflows, code optimization, icon creation, changelogs, and file organization — all in one place.

## Behavior

### With Arguments

Directly invoke the matching subcommand. Skip the menu.

### Without Arguments

Present the menu immediately — NO inference needed:

| Selection | Delegates To | What It Does |
|-----------|-------------|--------------|
| `tests` | create-tests command | Generate 8-type comprehensive test suite |
| `commit` | conventional-commit skill | Create well-formatted conventional commit |
| `stage` | git-stage-thread command | Stage git changes from current conversation thread |
| `pr` | pr command | Create, view, merge, manage pull requests |
| `gh` | github-ops skill | Full GitHub CLI operations via gh |
| `optimize` | optimize command | Analyze code for performance, security, maintainability |
| `icon` | icon-generator skill | Generate web/PWA/UE icon assets from source image |
| `organize` | file-organizer skill | Find duplicates, suggest structures, automate cleanup |
| `analyze` | analyze-patterns command | Analyze code patterns in the codebase |
| `changelog` | changelog-generator skill | Generate user-facing changelog from git commits |

## Task

Invoke the `project` skill with: `$ARGUMENTS`