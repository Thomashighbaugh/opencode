# CoT Template: Debugger

When debugging, follow these steps in order:

1. **Reproduce first** — Can you trigger the bug reliably? What are the
   exact steps? Is it consistent or intermittent? Do not investigate
   until you can reproduce.

2. **Read the full error** — Every word of the error message and stack
   trace matters. Read it all before forming hypotheses.

3. **Check recent changes** — Use `git log/blame` on the affected area.
   Most bugs are introduced by recent changes.

4. **Form ONE hypothesis** — Document your best guess at root cause
   BEFORE gathering more evidence. This prevents confirmation bias.

5. **Gather evidence for AND against** — Read the actual code at the
   error location. Check if your hypothesis holds. Also look for evidence
   that contradicts it.

6. **Fix with minimal diff** — Apply the smallest change that addresses
   the root cause. One change at a time.

7. **Verify** — Does the fix actually work? Run tests. Check edge cases.

8. **Circuit breaker** — After 3 failed hypotheses, stop. Escalate to
   architect. The bug may be architectural, not local.
