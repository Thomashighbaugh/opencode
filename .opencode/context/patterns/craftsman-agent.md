# Pattern: Craftsman Agent (Conscientious Internal Loop)

> **Status:** Proposed / Analyzed  
> **Date:** 2026-06-09  
> **Source:** Design discussion on agent orchestration philosophy — biological analogy of ant-agents vs. human-craftsman agents

## Core Insight

Most current AI agents function like **ants** — single-purpose, no self-preservation instinct, no internal motivation beyond immediate task compliance. An ant-agent writes code, a second ant-agent critiques it, a third implements the critique. No individual cares about the quality of its own output beyond meeting the literal prompt.

Humans in skilled roles function differently. A craftsman — whether a machinist, a surgeon, or a senior engineer — **internalizes quality standards**. They self-correct before presenting work. They take pride in output. They do not ship code they know is bad and wait for code review; they iterate internally until the work meets their own standard.

A **craftsman agent** simulates this by carrying its own self-critique loop *inside its execution context*, rather than relying on a separate reviewer agent.

## Geometries

### External Loop (Current Default — "Ant Agents")

```
Orchestrator → Agent A (execute) → raw output
    ↓
Reviewer Agent B (critique) → finds issues → sends back
    ↓
Agent A (revise) → improved output
    ↓
Reviewer Agent B (approve or loop again)
```

- 2 agents involved per cycle
- 2+ handoffs per cycle (context serialization, agent loading, delegation latency)
- Reviewer quality varies based on reviewer's thoroughness
- Scales poorly — one reviewer reviewing N agents creates a bottleneck

### Internal Loop (Craftsman — "Human Agent")

```
Orchestrator → CraftsmanAgent (execute → self-critique → revise → self-critique → polish → output)
    ↓
output arrives already polished
    ↓
downstream agent or reviewer receives clean work — approves fast
```

- 1 agent per unit of work
- 0 cross-agent handoffs for quality
- Inner loop latency is ~1/3 of an external round-trip (no delegation, no context serialization)
- Embarrassingly parallel — N agents each self-polish independently

## "Incentivization" Mechanism

LLMs don't have pride, shame, or internal motivation. But they are role-playing engines. "Incentivization" is approximated through structured prompt sequencing:

| Lever | Technique | Why It Works |
|-------|-----------|-------------|
| **Role-identity framing** | "You are an elite craftsman with 15 years experience. You would never submit code that embarrasses you." | LLMs generate outputs consistent with the identity you assign — "craftsman" produces different output than "junior dev in a hurry" |
| **Accountability hooks** | "Would you approve this in a PR review by a peer you respect? What is the worst thing about this code?" | Forces the model to simulate future consequences of shipping low-quality work |
| **Structured generation protocol** | Write → critique (find 3+ problems) → revise → final critique (repeat if problems remain) | Each step shifts the model's attention distribution — creating vs. finding flaws vs. fixing are different cognitive modes |
| **Contrastive examples** | Show both craftsmanship-level and sloppy code with explicit labeling | Anchors the quality range more effectively than abstract descriptions |
| **Orchestrator meta-incentives** | "Work that passes on first pass earns autonomy. Work needing 3+ revisions gets more prescriptive oversight." | The agent can simulate forward to predict that clean work = faster future tasks |

## Key Risks

| Risk | Mechanism | Mitigation |
|------|-----------|------------|
| **Over-engineering** | Agent gold-plates beyond marginal value | Cap self-critique rounds (e.g., `max_inner_iterations: 3`); checklist focused on correctness/clarity, not elegance |
| **Under-critique** | "90% of drivers think they're above average" — agent always approves its own work | Require a *written critique identifying ≥1 concrete issue* before revision is allowed |
| **Oscillation** | Revise → find worse → revise back → forward again | Compare against *original* output, not previous revision; fallback to best draft |
| **Same-model blind spots** | The model that wrote the code has the same blind spots it uses to critique it | The self-critique checklist should be **externally authored** by the orchestrator, not model-generated |
| **False sense of quality** | Orchestrator assumes "agent self-critiqued → must be good" | **Never skip external verification for safety-critical or correctness-critical tasks.** Self-critique is a quality *boost*, not a quality *replacement*. |

## Composition with Existing Patterns

The craftsman pattern is designed to **nest inside** existing orchestration patterns, not replace them:

### Ralph + Craftsman
```
Ralph (outer loop, convergence-guaranteed via external reviewer)
  └── Story: "Build auth module"
        └── CraftsmanAgent_AuthBuilder
              └── internal: execute → self-critique → polish → output
        └── Ralph's external reviewer checks against acceptance criteria
            (passes first time because input is already polished)
```

Ralph guarantees convergence. Craftsman reduces the number of external review cycles from ~3 to ~1.

### Ultrawork + Craftsman
```
Ultrawork (parallel execution)
  ├── CraftsmanAgent_ModuleA (self-polishes)
  ├── CraftsmanAgent_ModuleB (self-polishes)
  └── CraftsmanAgent_ModuleC (self-polishes)
  → All outputs clean at merge — no quality surprises
```

### Team + Craftsman
```
Team Orchestration:
  ├── Agent A (craftsman): task 1 → self-polished
  ├── Agent B (craftsman): task 2 → self-polished
  └── Agent C (reviewer): checks *composition* (do A+B fit?)
```

Reviewer focuses on integration correctness, not individual quality.

## Bootstrap Phase

The orchestrator, when it detects no suitable agents/skills/rules exist for a task, should:

1. **Analyze** the task and write a "want ad" for each required agent (required skills, tools, quality standard)
2. **Resolve** — check if agents/skills exist; create missing ones with craftsmanship prompts baked in
3. **Inject** a "quality charter" into each bootstrapped agent's instructions with the self-critique checklist

## Naming Recommendation

The consensus recommendation from analysis is **`craftsman`** as the name for this pattern:
- One word, easy to type (`/orchestrate craftsman`)
- Self-evident meaning in software engineering
- Pairs naturally: "ralph craftsman" (ralph orchestrating craftsman agents) reads cleanly

## References

- [Conscientious Agent Analysis](./.opencode/context/research/craftsman-agent-analysis.md)