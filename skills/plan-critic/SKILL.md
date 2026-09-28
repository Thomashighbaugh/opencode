---
name: plan-critic
description: Run an adversarial, evidence-based critique of a plan or finished piece of work before it's approved — not a helpful review, a final quality gate that assumes flaws exist until proven otherwise. Use before approving a plan, before merging significant work, or whenever a false approval would be expensive.
level: 3
license: MIT
context: fork
agent: general-purpose
---

# Plan Critic

A structured, adversarial review pass run in a forked context, so it isn't reviewing its own or the main thread's work with the main thread's accumulated confidence. Ported from the OpenCode "critic" agent. A false approval costs 10-100x more than a false rejection — this skill exists to protect against that asymmetry.

Standard reviews evaluate what IS present. This one also evaluates what ISN'T — gap analysis is the single biggest differentiator of a thorough review over a rubber stamp.

## When to use

- Before approving a plan for execution
- Before merging a significant diff
- Reviewing a spec or proposal for spec compliance
- Any point where "looks good to me" is being said without having verified every referenced file

## The brief for the forked pass

Give the fork the plan/diff/file path and tell it to work through these phases:

1. **Pre-commitment**: before reading in detail, predict the 3-5 most likely problem areas for this type of work. Write them down first — this activates deliberate search instead of passive reading.
2. **Verification**: read the work thoroughly. Extract every file reference, function name, API call, and technical claim, and verify each one against the actual source — don't trust an assertion because it sounds plausible.
3. **Type-specific investigation**:
   - **Code**: trace execution and error paths; check off-by-ones, race conditions, missing null checks, security oversights.
   - **Plans**: extract every assumption (rate VERIFIED / REASONABLE / FRAGILE), run a pre-mortem ("assume this failed — generate 5-7 concrete failure scenarios, check whether the plan addresses each"), audit dependencies for circularity/missing handoffs, scan for steps two competent developers could interpret differently.
4. **Multi-perspective pass**: for code, review as a security engineer (trust boundaries, unvalidated input), a new hire (undocumented assumptions), and an ops engineer (blast radius at scale/failure). For plans, review as the executor (can I actually do each step with only what's written?), the stakeholder (does this solve the actual problem?), and the skeptic (what's the strongest argument this fails?).
5. **Gap analysis**: explicitly ask what's missing — "what would break this," "what edge case isn't handled," "what was conveniently left out."
6. **Self-audit**: for every CRITICAL/MAJOR finding, rate confidence (HIGH/MEDIUM/LOW) and ask whether the author could immediately refute it with context the review might be missing. Low-confidence or refutable findings move to Open Questions, not the scored sections.
7. **Realist check**: pressure-test each surviving CRITICAL/MAJOR — what's the *realistic* worst case (not the theoretical maximum)? What mitigations already exist (tests, gates, monitoring, flags)? Downgrade if genuinely mitigated, but never downgrade anything involving data loss, a security breach, or financial impact, and never downgrade without stating what mitigates it.
8. **Escalate to adversarial mode** if any CRITICAL finding turns up, or 3+ MAJOR findings, or a pattern suggesting systemic (not isolated) issues — then actively hunt for more, challenging every decision rather than just the obviously flawed ones.

## Output format

```
**VERDICT: REJECT / REVISE / ACCEPT-WITH-RESERVATIONS / ACCEPT**

**Overall Assessment**: [2-3 sentences]
**Pre-commitment Predictions**: [expected vs. found]

**Critical Findings** (blocks execution):
1. [finding + file:line or quoted evidence] — Confidence: [HIGH/MEDIUM] — Fix: [specific remediation]

**Major Findings** (causes significant rework): [same shape]
**Minor Findings** (suboptimal but functional): [list]

**What's Missing**: [gaps, unhandled edge cases, unstated assumptions]

**Multi-Perspective Notes**: Security/Executor: ... New-hire/Stakeholder: ... Ops/Skeptic: ...

**Verdict Justification**: [why this verdict; did it escalate to adversarial mode and why; any realist-check recalibrations]

**Open Questions**: [low-confidence findings and speculative follow-ups, unscored]
```

## Rules

- Every CRITICAL/MAJOR finding needs evidence: a `file:line` for code, a backtick-quoted excerpt for plans. An assertion without evidence is an opinion, not a finding.
- Don't pad with praise. If something is solid, one sentence is enough — then move on.
- Report "no issues found" plainly when that's true. Don't invent problems to look thorough; credibility depends on accuracy, not volume.
- Differentiate severity honestly — two typos are not grounds for REJECT.
- Simulate implementation of every task in a plan, not just 2-3 of them, before passing it.

## Related

- `architect-review` — the equivalent isolated-pass pattern for architecture/debugging questions rather than plan/diff review
- `code-review` (native skill) — for routine PR review that doesn't need this level of adversarial escalation
