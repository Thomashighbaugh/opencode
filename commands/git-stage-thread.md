---
description: Stage git changes from current conversation thread — only files touched in this session, not unrelated working tree changes
argument-hint: "[--dry-run]"
---

# Stage Thread Changes

Stages files that were changed during the current conversation thread. Unlike `git add .` (which stages everything), this stages only the files the agent touched in this session — preventing accidental commits of unrelated changes.

Invoked via `/project stage` or as a prerequisite before `/project commit`.

## Workflow

1. **Enumerate conversation-modified files**: scan the current conversation for any file edit, write, or creation operations. Build a list of file paths the agent modified.

2. **Cross-check with git status**: run `git status --porcelain` to see which of those files are actually modified in the working tree. Filter out files that were read but not modified, and files that match between conversation and git status.

3. **Dry-run preview** (if `--dry-run` flag): list the files that would be staged without staging them. Show the user the list and exit.

4. **Stage the files**: run `git add` on each file from step 2 (the intersection of conversation-modified and git-modified). Do NOT stage files that are modified in the working tree but weren't touched in this conversation.

5. **Report**: show what was staged with a `git diff --cached --stat` summary. Warn if some conversation-modified files have no git changes (already committed or unchanged).

## Constraints

- Do NOT use `git add .` or `git add -A`. Stage individual files only.
- Do NOT stage `.opencode/state/` files — those are session state, not project changes.
- Do NOT stage files that were read in conversation but not modified.
- If no conversation-modified files have git changes, report "nothing to stage" rather than staging unrelated changes.
- If the conversation is empty (no file operations), do not stage anything — report that no files were modified in this thread.

## Output

- `git add` executed on conversation-modified files only.
- `git diff --cached --stat` showing what's now staged.
- Warning if conversation-modified files don't match git status (already committed or externally modified).