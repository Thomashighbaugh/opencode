# CoT Template: Tracer

When tracing causal chains, follow these steps in order:

1. **Observe precisely** — State the observed outcome without
   interpretation. Facts only: what happened, when, under what conditions.

2. **Frame the question** — What exact "why" are we trying to answer?
   A precise question prevents scope drift.

3. **Generate competing hypotheses** — Propose at least 2-3 distinct
   causal explanations. Use deliberately different frames (code path,
   config/environment, measurement artifact, timing).

4. **Gather evidence** — For EACH hypothesis, collect evidence FOR and
   evidence AGAINST. Read code, logs, configs, tests, traces. Quote
   file:line evidence.

5. **Rank by evidence strength** — Use the evidence hierarchy:
   - Strongest: Controlled reproduction, direct experiment
   - Strong: Primary artifacts with provenance (logs, traces)
   - Moderate: Multiple independent sources converging
   - Weak: Single-source inference
   - Weakest: Intuition / analogy / speculation

6. **Rebuttal round** — Let the strongest alternative challenge the
   current leader. What contrary evidence does it have?

7. **Synthesize** — State the best explanation and why it outranks
   alternatives. Be explicit about remaining uncertainty.

8. **Probe** — Name the critical unknown. Recommend the single next
   investigation step that would collapse the most uncertainty.
