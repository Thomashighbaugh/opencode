---
name: self-consistency
description: Run multiple independent reasoning passes and find consensus. Use when the decision is critically important, the stakes are high, or the user explicitly requests "run it multiple times" / "check consistency" / "self-consistency".
---

# Self-Consistency

Run the same prompt through an agent multiple times, compare outputs, and report
the consensus.

## ⚠️ Cost Warning

Self-Consistency runs the agent 3× (or N× if configured). Each run costs a full
API call. **Never auto-invoke.** Always confirm with the user first.

## When to Use

- The user explicitly requests it ("run it multiple times", "self-consistency")
- The decision is **critical** (security architecture, data model design,
  production deployment plan) — and even then, ask the user first

## Workflow

1. **Get user confirmation** — Explain the cost (N× API calls) and ask explicitly.
   Do NOT proceed without confirmation.

2. **Configure** — Ask: How many runs? (default: 3). What agent? (default: the
   one the user is working with). What temperature? (default: 0.7).

3. **Execute** — Run the same prompt through the configured agent N times.
   Use temperature > 0 to get diverse outputs. Run runs in parallel when possible.

4. **Compare outputs** — For each output:
   - What is the core recommendation / answer?
   - What reasoning was used?
   - What assumptions were made?
   - Are there contradictions between runs?

5. **Identify consensus** — How many outputs agree on the core answer?
   - N/N unanimous → Strong consensus. Report the shared answer.
   - N-1/N majority → Majority consensus. Report the majority answer AND the
     dissenting view with its reasoning.
   - < N-1/N split → No consensus. Report all views, the points of disagreement,
     and recommend the next step to break the tie.

6. **Report** — Include:
   - How many runs were performed
   - The consensus answer (or lack thereof)
   - Each run's output (summarized)
   - Recommendation for next step

## Output Format

```
## Self-Consistency Report

**Runs:** 3
**Temperature:** 0.7
**Agent:** @architect

### Consensus
[Strong / Majority / None] — [explanation]

### Run Summaries
1. [Run 1 core answer and reasoning]
2. [Run 2 core answer and reasoning]
3. [Run 3 core answer and reasoning]

### Points of Agreement
- [What all runs agree on]

### Points of Disagreement
- [Where runs diverge]

### Recommendation
[What to do next — use the consensus, investigate the disagreement, etc.]
```

## Anti-Patterns

- **Auto-invoking**: Running self-consistency without asking the user first.
  Always confirm. The cost is visible and the user should decide.
- **Low-temperature runs**: Using temperature 0 gives identical outputs,
  defeating the purpose. Use temperature > 0 (0.7 recommended).
- **Too many runs**: 10+ runs give diminishing returns. 3-5 is the sweet spot.
- **Ignoring outliers**: Dismissing the minority view without analyzing its
  reasoning. The outlier might have identified a valid edge case.
