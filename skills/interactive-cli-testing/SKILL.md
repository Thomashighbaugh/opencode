---
name: interactive-cli-testing
description: Verify real application behavior through interactive tmux sessions — start a service, send commands, capture actual output, assert against it, then clean up. Use when unit tests alone can't prove an app actually starts and behaves correctly, or when testing CLI/interactive behavior end-to-end.
level: 2
license: MIT
allowed-tools: Bash
---

# Interactive CLI Testing

Unit tests verify logic; this verifies that the thing actually runs. An application can pass every unit test and still fail on startup, integration, or user-facing behavior — this catches what automated tests miss, but only if sessions are always cleaned up (an orphaned tmux session interferes with the next run).

## Process

1. **Prerequisites**: confirm `tmux` is available, the target port is free, the project directory exists. Fail fast if not.
2. **Setup**: `tmux new-session -d -s qa-{service}-{test}-{timestamp}` (unique name — `test` collides with other runs). Start the service. Poll for a readiness signal (an expected output line, or `nc -z localhost {port}`) rather than sleeping a fixed amount.
3. **Execute**: `tmux send-keys`, wait briefly for output to land, then `tmux capture-pane -t {name} -p`.
4. **Verify**: check the *captured* output against the expected pattern — never assert before capturing.
5. **Cleanup**: `tmux kill-session -t {name}`, always, including on failure.

## Rules

- Always verify prerequisites before creating a session.
- Wait for readiness before sending commands — a service that isn't listening yet produces "connection refused," not a real failure signal.
- Capture output before making any assertion.
- Clean up every session, especially on failure — orphaned sessions are the most common cause of flaky repeated test runs.

## Output format

```
## QA Test Report: [Test Name]

### Environment
- Session: [tmux session name]   Service: [what was tested]

### Test Cases
#### TC1: [name]
- Command: `[sent]`   Expected: [...]   Actual: [...]   Status: PASS/FAIL

### Summary
Total: N   Passed: X   Failed: Y

### Cleanup
Session killed: YES   Artifacts removed: YES
```

## Related

- `project-session-manager` — for longer-lived dev-session tmux management (worktrees, issues, PRs), as opposed to this skill's one-shot verify-then-teardown loop
- `vitest`, `tdd` — for the unit-level testing this skill deliberately doesn't replace
