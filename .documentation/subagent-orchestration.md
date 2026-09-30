# Subagent Orchestration

31 subagents, one primary. The primary (`hubs`) is the sole entry point and handles work directly
by default; specialists are dispatched deliberately, never reflexively.

This is the policy layer: who does what, what a specialist is allowed to decide, and what has to
come back to the human.

---

## The roster

| Category | Agents |
| -------- | ------ |
| **Planning & analysis** | `planner`, `analyst`, `architect`, `deep-thinker` |
| **Implementation** | `executor`, `refactoring`, `code-simplifier`, `frontend-design` |
| **Quality & review** | `code-reviewer`, `security-reviewer`, `test-engineer`, `qa-tester`, `verifier`, `tracer`, `critic` |
| **Research & documentation** | `explore`, `scientist`, `writer`, `document-specialist`, `convention-extractor` |
| **Design** | `designer` |
| **Workflow & DevOps** | `debugger`, `git-master`, `commit-drafter` |
| **Specialized** | `config-orchestrator`, `skill-creator`, `stack-detector`, `requirements-analyzer`, `effort-estimator`, `prompt-simplifier` |
| **Primary** | `hubs` — the only agent a session starts as |

Every agent definition is wrapped in `<Agent_Prompt>` and validated structurally by
`tests/global/agent-format.test.ts` (280 tests) — format, required sections, frontmatter, and
delegation target resolution.

---

## The dispatch policy

`hubs` does the work itself unless a subagent would be **meaningfully** faster or better. That
is a real gate, not a formality: dispatching a subagent costs an LLM request, a context transfer,
and a reconciliation step, so a delegation that saves nothing is a net loss.

```
Is the task single-focus and deep?
  ├─ no  → do it directly. One agent, no transfer, no reconciliation.
  └─ yes → is a specialist meaningfully better here?
            ├─ no  → do it directly.
            └─ yes → propose the pattern, get approval, then dispatch
```

### Never auto-deployed

Subagents are never deployed without a human go-ahead, with three exceptions: the user explicitly
invokes a hub subcommand, explicitly names a subagent, or explicitly asks for parallel execution.

The alternative — an agent silently deciding to fan out — is how token budgets disappear.

### Self-contained prompts

A dispatched agent gets a fresh context. Everything it needs goes in the prompt: file contents,
the relevant rules, the expected output format, and the verification command. An agent that
needs three follow-up turns to get started has cost more than it saved.

---

## Modes

`modes.ts` provides long-running execution modes. Crucially, **magic keywords only detect**.

| Keyword                            | Proposes |
| ---------------------------------- | -------- |
| `ralph`, `don't stop`, `must complete` | Ralph   |
| `autopilot`, `build me`, `create me`   | Autopilot |
| `ultrawork`, `ulw`, `uw`              | Ultrawork |
| `deep interview`                     | Deep-interview |
| `cancel`, `stop`                     | Cancel |

```ts
// keywords.ts injects a proposal. It does not activate.
queueContextMessage(sessionId, `<mode-detected names="${names}">…`)
```

Auto-activation on a keyword is the failure mode where an agent starts looping and nobody
decided to. Detection is safe; activation is a human decision.

---

## Modes and hooks interact

When a mode delegates via the `task` tool, the
[`command-hooks`](../command-hooks.jsonc) `after`/`task` hooks fire. `callingAgent` is derived
from `args.subagent_type`, which the before-hook caches — OpenCode's after-hook receives no tool
arguments, so a hook filtered on the calling agent would otherwise match nothing on exactly the
event people write it for.

That is why `typecheck-after-task` and `tests-after-task` see every subagent, and it is asserted
by test.

---

## Verification is a gate, not a report

`verifier` and `code-reviewer` exist as a required step in the flow rather than as an option.

The default is self-verification: the agent runs the test or lint command and reads the output
before reporting completion. This is now backed mechanically — the `typecheck-after-task` hook
means the check happens whether or not the agent remembered to ask.

When independent review is warranted — a high-risk change, a self-review that looks too clean, or
a user request — `verifier` and `code-reviewer` run separately. Self-review of one's own work has
a known blind spot; the same model reviewing its own output inherits it.

---

## Completion guardrail

`rules/completion-guardrail.md` is a **mandatory stop** between planning and implementation. After
an analysis, plan, or research task, the agent presents the result and waits.

The only exception is explicit pre-authorisation in the same command — "plan and implement X", or
a chained command. A harness that lets a model move from a plan to writing code without a human
in the loop has not saved the human any decisions.

---

## Interdependencies

| This system uses | From |
| ---------------- | ---- |
| `after`/`task` hooks fire on every dispatch | [Command Hooks](plugins-command-hooks.md) |
| Mode and focus state persistence | [Memory System](memory-system.md) |
| Per-agent hooks in agent frontmatter | [Command Hooks](plugins-command-hooks.md) |
| Turn/token budgets | [Efficiency](request-token-efficiency.md) |
| Subagent identity as graph nodes | [Knowledge Plane](knowledge-plane.md) |

→ Next: [Hub Command System](hub-command-system.md)
