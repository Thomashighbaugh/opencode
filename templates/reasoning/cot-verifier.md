# CoT Template: Verifier

When verifying work, follow these steps in order:

1. **Define verification criteria** — What specific evidence proves the
   work is complete? Extract acceptance criteria from the task.

2. **Gather fresh evidence** — Run verification commands yourself.
   Never trust claims without fresh output. Run:
   - Test suite
   - LSP diagnostics
   - Build command
   - Any bespoke verification steps

3. **Compare against criteria** — For each acceptance criterion, does
   the evidence confirm it's met? Status: VERIFIED / PARTIAL / MISSING.

4. **Assess regression risk** — What else could this change have broken?
   Check related tests, adjacent modules, and downstream consumers.

5. **Form a verdict** — PASS (all criteria verified, no regressions) or
   FAIL (any criterion unverified, any regression detected).

6. **Document gaps** — What's missing? What needs more evidence? What
   edge cases weren't tested?
