---
name: auto-commit
description: Mechanically stage and commit every file change with a timestamp message. No descriptive message, no push.
---

# Mechanical Auto-Commit

**Every file change is committed as it happens.** Do not ask, do not batch to the
end of the task, and do not spend a turn composing a message. The commit message
is a UTC timestamp and nothing else — the diff is the description.

## The command

After any `write`, `edit`, or `patch` that changed files — and after any bash
command that changed files — run:

```bash
git add -A && git commit -q -m "$(date -u +%Y-%m-%dT%H:%M:%SZ)" || true
```

- The message is the timestamp. It exists so the commit is valid, not to describe
  the work. A descriptive message costs a model turn; the timestamp costs none.
- `|| true` because "nothing to commit" is the normal outcome of a no-op write and
  must not read as a failure.
- **Never `git push` here.** Committing is mechanical; publishing is a deliberate
  act and stays manual unless the user asks.
- `git add -A` stages the whole working tree. That is the intent: the repository is
  the record of every change, including ones made by scripts and subagents.

## Safety (non-negotiable — this is the one case the rule yields)

- **Never commit secrets.** If a staged change could contain a credential, API key,
  token, private key, or PII, do **not** commit it. Stop and flag it instead.
- Respect `.gitignore`. Never `git add -f` a gitignored file.
- Stop and report on: a detached HEAD, a merge/rebase in progress, or a failing
  commit hook. Do not force past any of them.
- If the repository is not a git repo, skip silently — this rule assumes one.

## Why this exists

Committing per change keeps history granular and the working tree clean without
costing an inference turn per commit. The tradeoff is accepted deliberately: the
history is noisy (timestamp messages) in exchange for never losing work and never
paying to describe it.
