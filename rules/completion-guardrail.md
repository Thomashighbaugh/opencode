---
name: completion-guardrail
description: Mandatory stop before transitioning from planning/analysis/research to implementation. The model MUST NOT skip from ideation/harvest-context to code changes without explicit user approval.
---

# Completion Guardrail

## The Problem

When the model completes a planning, analysis, or research task (e.g., `/ideation`, `/harvest-context`), it sometimes continues into implementation without asking the user. This is **never acceptable**. The user must explicitly approve the plan before any code is written.

## The Rule

**After completing any planning, analysis, research, or context-harvesting task, the model MUST stop and present the result to the user. It MUST NOT proceed to implementation, code changes, or orchestration without explicit user approval.**

This applies to:
- `/ideation` subcommands (plan, research, web-research, tech-eval, competitive-analysis, etc.)
- `/harvest-context` subcommands (web-research, compare, docs, consume, etc.)
- Any inline analysis that produces a plan, report, or recommendation
- Any subagent output that contains a plan or design

## The Pattern

```
1. Complete the task → produce output
2. Save output to state directory
3. Present summary to user
4. STOP. Do NOT offer to implement. Do NOT start coding.
5. Wait for user response
```

## What "Stop" Means

- Do NOT say "Shall I implement this now?" — that's still a leading question
- Do NOT start writing code
- Do NOT dispatch executor agents
- Do NOT call `/orchestrate`
- Simply present the result and wait

The user will say "looks good, implement it" or "run with it" or similar. Only then may you proceed to implementation.

## Exceptions

The only exception is when the user explicitly pre-authorizes implementation in the same command:
- "Plan and implement X" — user explicitly asked for both
- "/ideation plan X then /orchestrate ralph" — user explicitly chained commands
- User says "go ahead" or "implement it" after reviewing the plan

## Enforcement

This rule is loaded as a startup instruction. Any agent that violates it is in error. If you catch yourself about to implement after planning, stop and present the result instead.
