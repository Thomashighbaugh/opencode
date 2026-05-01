---
name: ccg
description: Multi-model orchestration via ask commands for alternative perspectives, then synthesis
level: 5
---

# CCG - Tri-Model Orchestration

CCG routes through the canonical `/ask` skill to get perspectives from multiple models, then synthesizes into one answer.

Use this when you want parallel external perspectives without launching tmux team workers.

## When to Use

- Backend/analysis + frontend/UI work in one request
- Code review from multiple perspectives (architecture + design/UX)
- Cross-validation where different models may have different strengths
- Fast advisor-style parallel input without team runtime orchestration

## How It Works

```text
1. Decomposes the request into advisor prompts for different models
2. Runs queries via /ask skill with available models
3. Artifacts are written under `.opencode/state/artifacts/ask/`
4. Synthesizes outputs into one final response
```

## Execution Protocol

When invoked, follow this workflow:

### 1. Decompose Request
Split the user request into:

- **Architect/model prompt:** architecture, correctness, backend, risks, test strategy
- **Designer/model prompt:** UX/content clarity, alternatives, edge-case usability, docs polish
- **Synthesis plan:** how to reconcile conflicts

### 2. Invoke advisors via /ask

> **Note:** Use the /ask skill to query different models for perspectives.

Run advisors using available models:

```bash
/ask glm-5 "<architect prompt>"
/ask kimi-k2.5 "<designer prompt>"
```

### 3. Collect artifacts

Read ask artifacts from:

```text
.opencode/state/artifacts/ask/*.md
```

### 4. Synthesize

Return one unified answer with:

- Agreed recommendations
- Conflicting recommendations (explicitly called out)
- Chosen final direction + rationale
- Action checklist

## Fallbacks

If one model is unavailable:

- Continue with available models + synthesis
- Clearly note missing perspective and risk

If models are unavailable:

- Fall back to primary model answer and note external advisors were unavailable

## Invocation

```bash
/ccg <task description>
```

Example:

```bash
/ccg Review this PR - architecture/security via one model and UX/readability via another
```