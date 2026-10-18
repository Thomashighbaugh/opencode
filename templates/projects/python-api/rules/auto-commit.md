---
name: auto-commit
description: Commit once per turn when the session goes idle — not per file edit. Mechanical message, no push.
---

# Auto-Commit at Turn Boundaries

**One commit per turn, not per file.** The `auto-commit-on-idle` hook runs when the
root session goes idle: it stages the working tree and commits only if something
changed. Three edits in one turn produce one commit. A ten-file refactor produces
one commit.

Do not run a commit yourself after each write. Do not ask permission. Do not spend a
turn composing a message. If the user asks for a commit before the turn ends, run the
command in **The command** below.

## The command

The hook runs this at session idle. Run it by hand only when the user asks for an
intermediate commit:

```bash
# Stage everything except submodule pointer changes, then commit if dirty.
excludes=$(git submodule foreach --quiet 'printf ":(exclude)%s\n" "$sm_path"' 2>/dev/null)
git add -A -- $excludes
git diff --cached --quiet && exit 0
# Secret check runs here — see below.
names=$(git diff --cached --name-only)
count=$(printf '%s\n' "$names" | grep -c .)
git commit -q -m "auto: ${count} file(s): $(printf '%s\n' "$names" | head -4 | tr '\n' ' ')"
```

- The message is mechanical: file count plus the first four paths. It describes the
  diff without costing an inference turn. It is not the place to explain the work.
- `git diff --cached --quiet` short-circuits: a turn that changed nothing commits
  nothing, so idle turns stay free.
- **Never `git push` here.** Committing is mechanical; publishing is a deliberate
  act and stays manual unless the user asks.
- The whole working tree is staged — the repository is the record of every change,
  including ones made by scripts and subagents — **except submodule pointers**. A
  submodule is its own repository with its own history; a drifted gitlink
  (`external/*` in this repo) is not a consequence of editing a file, and folding it
  into a commit silently advances the revision the superproject records. Submodule
  pointer updates are staged deliberately, or not at all.

## Safety (non-negotiable — this is the one case the rule yields)

- **Never commit secrets.** If a staged change could contain a credential, API key,
  token, private key, or PII, do **not** commit it. Stop and flag it instead. The
  hook refuses to commit content matching common key formats; anything it misses is
  still your responsibility.
- Respect `.gitignore`. Never `git add -f` a gitignored file.
- Stop and report on: a detached HEAD, a merge/rebase in progress, or a failing
  commit hook. Do not force past any of them.
- If the repository is not a git repo, skip silently — this rule assumes one.

## Why this exists

Committing at the turn boundary keeps the working tree clean without drowning the
history in one commit per keystroke. The message costs no inference turn, and a turn
that changed nothing commits nothing.
