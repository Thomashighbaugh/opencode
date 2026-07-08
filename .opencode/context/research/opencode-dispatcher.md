---
title: "opencode-dispatcher — Workflow Pack for Structured, Auditable Agent Sessions"
type: source-summary
tags: [opencode, plugin, workflow, agents, orchestration, task-artifacts, permission-model]
created: 2026-07-07
updated: 2026-07-07
sources: [github-readme, docs-workflow, docs-agents, docs-configuration]
status: active
---

# opencode-dispatcher

Workflow pack for OpenCode that adds specialist development agents coordinated through file-based task artifacts. Designed for substantial coding work where agent workflow needs inspection, resume, and validation.

## Core Concept

Durable task state in `.ai/tasks/` — task specs, implementation reports, validation reports, documentation reports. Not chat history. Any agent can pick up where another left off by reading task artifacts.

## 5 Core Agents

| Agent | Role |
|-------|------|
| **Orchestrator** | User-facing coordinator, 6-state state machine (INTAKE → CLARIFY → ROUTE → DELEGATE → REVIEW → DONE). Routes to smallest safe path. Writes `planning-handoff.md` for non-trivial work. |
| **Documentation** | Durable source artifacts (UX briefs, ADRs, domain models, API contracts). Docs-first routing: orchestrator routes here before task-planner when cross-cutting context is missing. |
| **Task Planner** | Creates auditable task specs under `.ai/tasks/<NNN>-<slug>/task-spec.md`. Owns path allocation, parent/child manifests, required spec sections. |
| **Implementer** | Edits source code per approved task spec. Writes implementation report. Optional agy integration for quota-split across models. |
| **Validator** | Checks completed work against task spec + cited source artifacts. Runs tests from acceptance criteria. Writes validation report. |

Plus: Executor (fast path, mechanical edits), Test Writer (tests only, no impl), Research (external facts), Shipper (git commit/push), Init (bootstrap `.ai/context.md`), Model Config (per-agent model assignment).

## Orchestrator State Machine

6 states: INTAKE → CLARIFY → ROUTE → DELEGATE → REVIEW → DONE. Not every request passes through every state — always smallest safe workflow.

## Task Artifact Layout

```
.ai/tasks/<NNN>-<task-id>/
    task-spec.md              # Approved scope, acceptance criteria, constraints
    implementation-report.md  # What changed, approach, open questions
    validation-report.md      # Verification results against spec + source artifacts
    documentation-report.md  # Outcome, context updates, follow-ups
    planning-handoff.md      # Structured handoff from orchestrator (optional)
    agy-handoff.md           # Bounded context handoff for agy delegation (optional)
```

## Permission Model

Deny-by-default. Each agent gets only what its role requires:

- **Orchestrator**: `edit: deny` except `.ai/tasks/**/planning-handoff.md`. `bash` whitelist — read-only commands only. No git write commands.
- **Task Planner**: `edit` only on `.ai/tasks/**` and `.ai/decisions/**`.
- **Implementer**: `edit` on source code + own reports. Cannot touch `.ai/tasks/**` (except own reports), `.ai/context.md`, `.ai/decisions/**`.
- **Validator**: `edit` only on `validation-report.md`. `bash: * allow` for running tests.
- **Test Writer**: `edit` only on test file patterns. No `task` permission.
- **Documentation**: `edit` on `docs/**`, `README*`, `CHANGELOG.md`, own reports. Config files denied.
- **Research**: `edit: deny`, `webfetch: allow` only.
- **Shipper**: `edit: deny`, strict git command whitelist. Destructive git ops denied.
- **Init**: `edit` only on `.ai/context.md`. `question: allow`.
- **Model Config**: `edit` only on `opencode.jsonc` / `.opencode/opencode.jsonc`. No `task` permission.

Escape hatches sealed: `edit: deny` not subvertable through shell (orchestrator bash whitelist is read-only). `bash` whitelists exclude write-capable commands.

## Docs-First Routing

When correctness depends on cross-cutting/reusable context not yet in durable form, orchestrator routes to Documentation BEFORE Task Planner. Task Planner cites approved source artifacts.

## Rich Handoff

10-field structured handoff from orchestrator to task-planner: User Intent, Conversation-Derived Context, Source Artifacts, Proposed Task Shape, Assigned Output Paths, Scope/Non-Goals, Constraints, Acceptance Signals, Authority Boundary, Open Questions/Stop Conditions. Materialized as `planning-handoff.md`.

## Agy Integration

Optional. Implementer writes `agy-handoff.md` with full bounded context, then invokes `agy --dangerously-skip-permissions --print "Read and execute the handoff file at <path>"`. Flag is intentional for bounded backend mode — work scope fully defined by inspected handoff document. Enabled via `agy: enabled` flag in `.ai/context.md` under `## Workflow`.

## Model Config

Two-tier group system: MED (validator, test-writer, documentation, init) and LOW (implementer, research, executor, shipper, model-config). Orchestrator and task-planner models chosen directly by user. Model-config agent runs `opencode models --verbose`, presents groups, asks user to pick models.

## Install

```bash
npx opencode-dispatcher install
```

Installs 11 agent definitions into `~/.config/opencode/agents/`. Backs up existing paths with `.bak-<timestamp>` suffix. Does NOT touch `~/.config/opencode/AGENTS.md`, `skills/`, `templates/`, or project-level config.

## Key Design Principles

- Task state durable and inspectable in `.ai/tasks/` files, not chat history
- Work resumable — any agent can pick up by reading artifacts
- Artifacts git-tracked — review what was planned, changed, validated
- Each task validated against approved scope
- Permission model: deny-by-default, layered (edit/bash/task scoped independently)
- No agent can silently cross role boundaries
