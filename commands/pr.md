---
description: Create, view, merge, or manage pull requests via GitHub CLI — create, list, view, checks, review, merge
argument-hint: "<action> [args]"
---

# Pull Request Manager

Manages pull requests via the GitHub CLI (`gh`). Invoked via `/project pr <action>`.

## Actions

### /project pr create

Create a new PR from the current branch to the base branch.

1. **Determine base branch**: detect the default branch (main/master) or accept `--base=<branch>` flag.
2. **Gather PR metadata**:
   - Title: from the latest commit on the current branch, or from the conversation context.
   - Body: summarize the changes in this branch. Read `git log base..HEAD --oneline` for commits, `git diff base..HEAD --stat` for scope. Draft a structured body: summary, changes, testing, notes.
   - Labels: detect relevant labels from the change type (bug, feature, etc.) or accept `--labels=` flag.
   - Reviewers: accept `--reviewers=` flag or skip.
3. **Run**: `gh pr create --title "..." --body "..." --base <branch> [--label ...] [--reviewer ...]`
4. **Report**: the PR URL and number.

### /project pr view [number]

View a PR's details.

1. Run: `gh pr view <number>` (uses current PR if no number given).
2. Show: title, body, author, status, checks, reviews, mergeable state.
3. If `--diff` flag: also show `gh pr diff <number>`.

### /project pr list

List open PRs.

1. Run: `gh pr list --limit 30`
2. Show: number, title, author, status, updated. Filter by `--state=closed` or `--author=<user>` if flags given.

### /project pr checks [number]

Show CI check status for a PR.

1. Run: `gh pr checks <number>` (current PR if no number).
2. Show: check name, status (pass/fail/pending), link to details.
3. If any failing: show the log excerpt via `gh run view --log-failed`.

### /project pr review [number]

Submit a review on a PR.

1. Accept `--approve`, `--request-changes`, or `--comment` (default) flag.
2. If `--request-changes` or comment: accept `--message="..."` for the review body.
3. Run: `gh pr review <number> --<action> [--body "..."]`
4. Report: review submitted.

### /project pr merge [number]

Merge a PR.

1. Accept `--squash`, `--merge`, or `--rebase` strategy (default: squash).
2. Accept `--delete-branch` flag to delete the branch after merge.
3. Run: `gh pr merge <number> --<strategy> [--delete-branch]`
4. Report: merged, branch deleted (if flag).

## Constraints

- Always use `gh` CLI. Never use raw git push + GitHub API calls.
- Never force-push or force-merge. If mergeable state is not "clean", report the blocker.
- Check for secrets in the diff before creating a PR (run security scan if `--security` flag).
- Do not auto-merge a PR the agent created in the same session without explicit user approval.

## Output

- Command output from `gh` (PR URL, status, diff, etc.).
- For `create`: the PR URL and number.
- For `merge`: confirmation and branch deletion status.