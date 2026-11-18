import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "antislop-audit",
  description: "Slop audit — numbered findings list, then approved fixes",
  reminder: "Audit existing work: numbered findings citing R-XX rules and priorities. User approves numbers before any fix.",
  inline: true,

  detailedDescription: `Anti-slop After-mode audit. Audits work that already exists and produces a numbered findings list in anti-slop/audit-001-YYYY-MM-DD.md (numbers keep rising across audits).

## Process (anti-slop After mode, exact)

1. Scan the existing UI/copy/accessibility against the 40 antislop rules (rules/antislop.md) and the Liveliness Toolkit (rules/antislop-liveliness.md).
2. Write findings to anti-slop/audit-001-YYYY-MM-DD.md. Each finding:
   - A number (rising across audits: 001, 002, ...)
   - The violated rule (R-XX) with tier (Hard Gate = HIGH, Purpose-Gate = MEDIUM, Quality Locks = LOW)
   - A one-line reason
3. Do NOT modify anything until the user approves specific numbers. Numbers not mentioned are not touched.
4. After approval, fix the approved items and write a follow-up report.

## Output

anti-slop/audit-001-YYYY-MM-DD.md — numbered findings list with priorities.

## When to use

"After" mode: you already have work and want to know what slop is in it before deciding what to fix. Equivalent to antislop's audit mode.

## Examples

| Input | Approach |
|-------|----------|
| /verify-hub antislop-audit | Scans current work, writes numbered findings with R-XX citations and HIGH/MEDIUM/LOW priorities, asks user to approve numbers before fixing. |
| /verify-hub antislop-audit --approve 003,007 | Fixes only findings 003 and 007, then writes a follow-up report. |
`,
  tools: ["read", "grep", "glob", "bash", "taskTodos"],
  rules: ["antislop", "anti-sycophancy"],
  relatedSkills: ["antislop-ui", "antislop-copywriting", "antislop-human", "antislop-layoutmobile", "antislop-code"],
  warnings: [
    "No edits happen before user approval of specific finding numbers. This is anti-slop's After-mode contract.",
    "Findings cite rules by number — no sycophantic softening. A slop pattern is named plainly.",
  ]
}

export default spec
