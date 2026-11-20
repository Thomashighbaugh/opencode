import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "antislop-gate",
  description: "Slop Delivery Gate — PASS/FAIL report before shipping",
  reminder: "Run the slop check + click-through smoke test. PASS/FAIL report blocks delivery.",
  inline: true,

  detailedDescription: `Anti-slop Delivery Gate. Runs the full rule check (Hard Gate, Purpose-Gate, Quality Locks, Prose Signals from rules/antislop.md) plus the Liveliness Toolkit (rules/antislop-liveliness.md), then a R-35 click-through smoke test: every interactive element exercised one at a time, per-element evidence recorded.

## Output

A PASS/FAIL report written to .opencode/state/verify-hub/anti-slop/gate-YYYY-MM-DD.md.

- Hard Gate failures = FAIL, block delivery immediately.
- Purpose-Gate failures = FAIL unless a written one-line purpose exists for each technique.
- Quality Lock failures = FAIL unless each decision has a written reason.
- R-35 click-through evidence: element-by-element results (e.g. "Signup -> opens /signup with no console errors", "empty form -> shows validation", "mobile menu -> opens and closes"), every theme and breakpoint exercised.

## Writer/reviewer separation

The agent does not self-approve high-impact gate fixes. FAIL items are reported; the user approves which to fix. A separate pass implements approved fixes, then the gate re-runs.

## When to use

Close of a "during" build session, or before shipping any UI/copy/accessibility work. Equivalent to antislop's mandatory pre-delivery gate.

## Mode

Resolves antislop mode (during/after/ask) via antislop-mode before running. Announces "antislop active: during (session override.)" once per session.

## Examples

| Input | Approach |
|-------|----------|
| /verify-hub antislop-gate | Resolves mode, loads antislop + antislop-liveliness rules, runs 40-rule check + click-through, writes gate report, reports PASS/FAIL with per-element evidence. |
| /verify-hub antislop-gate --theme dark | Same, plus verifies both light and dark themes per R-34. |
`,
  tools: ["read", "grep", "glob", "bash", "taskTodos"],
  rules: ["antislop", "antislop-liveliness", "antislop-signal-hygiene", "security"],
  relatedSkills: ["antislop-ui", "antislop-copywriting", "antislop-human", "antislop-layoutmobile", "antislop-code"],
  warnings: [
    "Gate report is evidence, not a verdict you can override silently. FAIL items block delivery until the user approves fixes.",
    "R-35 requires the app to be runnable. Static mockups/chat-only outputs are verified by code inspection instead of clicking.",
  ]
}

export default spec
