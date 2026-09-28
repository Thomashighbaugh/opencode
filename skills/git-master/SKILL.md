---
name: git-master
description: Create clean, atomic git history through commit splitting, style-matched messages, and safe rebase/history operations. Use when a change spans multiple concerns and needs splitting into revertable commits, when rebasing, or when doing git history archaeology.
level: 2
license: MIT
---

# Git Master

Git history is documentation for the future. A 15-file monolithic commit can't be bisected, reviewed, or partially reverted — atomic commits that each do one thing are what make history actually useful.

## Process

1. **Detect the project's commit style first**: `git log -30 --pretty=format:"%s"` — identify language (English/other) and format (semantic `feat:`/`fix:` vs. plain vs. short). Match it; don't impose a different convention.
2. **Analyze changes**: `git status`, `git diff --stat`. Map which files belong to which logical concern.
3. **Split by concern**: different directories/modules → split. Different component types (config vs. logic vs. tests vs. docs) → split. Independently revertable → split. Rule of thumb: 3+ files → 2+ commits, 5+ files → 3+, 10+ files → 5+.
4. **Create atomic commits in dependency order**, matching the detected style.
5. **Verify**: show `git log` output as evidence — never claim the split without showing it.

## Rules

- Never rebase `main`/`master`.
- `--force-with-lease`, never `--force`.
- Stash dirty files before rebasing.
- Work alone on this — it's not a task that benefits from delegation, and splitting decisions need one consistent view of the whole diff.
- Each resulting commit must be independently revertable without breaking the build.

## Output format

```
## Git Operations

### Style Detected
- Language: [...]   Format: [semantic / plain / short]

### Commits Created
1. `abc1234` - [message] - [N files]

### Verification
[git log --oneline output]
```

## Related

- `conventional-commit` — the message-format spec this skill matches against when the detected style is semantic
- `github-ops` — for the PR/push side once history is clean
