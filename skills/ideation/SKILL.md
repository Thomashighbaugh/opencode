---
name: ideation
description: Planning, research, and ideation hub — pick a method, develop an idea iteratively, approve and export
level: 2
---

# Ideation

Unified entry point for all planning and research methods. Each subcommand is a hardfork into a specific methodology with shared lifecycle behavior.

## When to Use

- Starting a new feature, project, or task and need to plan before building
- Researching a topic before committing to an approach
- Refining a vague idea into an actionable plan
- Any situation where "think before you code" applies

## No-Argument Behavior

When invoked without arguments (`/ideation`), list the subcommands as plain text and ask the user to choose. Do NOT call `hubMenu` or any other tool — just output the list directly. Available methods: plan, brainstorm, decomposition, refine, deep, graph, research, ralplan, ddd, event-storming, double-diamond, jtbd, impact-mapping, spiral, top-down, bottom-up, adversarial-debate, cleanroom, pwf, rpikit, hive, story-mapping, lean-canvas, constitution.

## With-Argument Behavior

Directly invoke the matching subcommand. Print the reminder, then delegate to the corresponding skill.

## Subcommands

### `/ideation plan` — Strategic Planning

**Method:** `plan`

Interview-style planning. Asks clarifying questions, identifies constraints, breaks goals into ordered tasks with acceptance criteria.

**Reminder shown to user:**
> Plan: Interview-style strategic planning. I'll ask clarifying questions, identify constraints, and break your goal into ordered tasks with acceptance criteria.

**Delegates to:** `plan` skill

---

### `/ideation decomposition` — Task Decomposition

**Method:** `decomposition`

Breaks a complex task or goal into smaller, actionable subtasks. Identifies dependencies, orders them logically, and defines clear acceptance criteria for each subtask. Good for turning amorphous "build X" requests into a concrete work plan.

**Reminder shown to user:**
> Decomposition: Breaking down your task into ordered, actionable subtasks. I'll identify dependencies, define acceptance criteria for each, and produce a clear work breakdown.

**Delegates to:** inline (executed directly)

---

### `/ideation refine` — Idea Refinement

**Method:** `idea-refine`

Structured diverge/converge. Expands ideas through structured brainstorming, then converges on the strongest concepts.

**Reminder shown to user:**
> Refine: Diverge/converge iteration. I'll expand your idea through structured brainstorming, then help you converge on the strongest version.

**Delegates to:** `idea-refine` skill

---

### `/ideation deep` — Deep Interview

**Method:** `deep-interview`

Socratic deep interview with mathematical ambiguity gating. Crystallizes vague requirements through iterative questioning. Won't proceed past ambiguous points until resolved.

**Reminder shown to user:**
> Deep: Socratic interview with ambiguity gating. I'll ask probing questions until your requirements are fully crystallized. Vague points won't be swept past.

**Delegates to:** `deep-interview` skill

---

### `/ideation graph` — Graph Thinking

**Method:** `graph-thinking`

Visual relationship mapping. Maps dependencies, components, and tradeoffs as a graph structure. Good for architecture decisions and system design.

**Reminder shown to user:**
> Graph: Visual relationship mapping. I'll map dependencies, components, and tradeoffs as a graph to reveal structure you might miss linearly.

**Delegates to:** `graph-thinking` skill

---

### `/ideation research` — Multi-Model Research

**Method:** `ccg` (with `sciomc` for comprehensive mode)

Multi-model research synthesis. Queries diverse perspectives, merges findings into a coherent answer. Good for technical decisions with tradeoffs.

**Reminder shown to user:**
> Research: Multi-model synthesis. I'll gather diverse perspectives on your question and merge them into a coherent, cross-referenced answer.

**Delegates to:** `ccg` skill (comprehensive mode uses `sciomc`)

---

### `/ideation ralplan` — Consensus Planning

**Method:** `ralplan`

Consensus-planning gate. Auto-gates vague requests before execution. Good for ensuring an idea is well-formed enough to hand off to orchestration.

**Reminder shown to user:**
> Ralplan: Consensus planning gate. I'll validate that your plan is concrete enough to execute, and if not, run an interview to sharpen it first.

**Delegates to:** `ralplan` skill

---

## Shared Lifecycle

Every subcommand follows this lifecycle:

### Step 0: Check State Directory

```bash
mkdir -p .opencode/state/ideation/work-products
```

### Step 1: Check Prior Work

Before starting, scan for relevant cached work:

```bash
ls .opencode/state/ideation/work-products/ 2>/dev/null
```

If relevant prior work exists (matching topic or method):
- Ask user: "Found prior ideation work on [topic]. Resume, start fresh, or use as context?"

### Step 2: Print Method Reminder

Show the static 1-2 line description for the selected method (see above). Do NOT generate this dynamically.

### Step 3: Execute Method

Load and execute the appropriate skill:

| Subcommand | Skill to Load |
|------------|---------------|
| `plan` | `plan` |
| `decomposition` | inline (executed directly) |
| `refine` | `idea-refine` |
| `deep` | `deep-interview` |
| `graph` | `graph-thinking` |
| `research` | `ccg` |
| `ralplan` | `ralplan` |

### Step 4: Cache In-Progress Work

After each significant iteration, write intermediate results:

```bash
# Write work product
WORK_ID="$(date +%Y%m%d_%H%M%S)_${METHOD}_${TOPIC_SLUG}"
cat > ".opencode/state/ideation/work-products/${WORK_ID}.md" << 'EOF'
# Ideation Work Product

**Method:** {method}
**Topic:** {topic}
**Status:** in-progress
**Started:** {timestamp}
**Last Updated:** {timestamp}

## Current State
{current iteration output}

## Open Questions
{unresolved items}

## Next Steps
{what comes next}
EOF
```

### Step 5: Iterate Until Approved

Continue the iterative process with the user. At each checkpoint:
- Summarize current state
- Ask: "Does this capture what you need, or should we refine further?"
- Only proceed to finalization when user explicitly approves

**User approval phrases that trigger finalization:**
- "looks good" / "approved" / "finalize" / "that's it" / "done" / "ship it"

### Step 6: Finalize and Report

On user approval, save the final output and report results inline. Combine hand-off offer and session summary into a single turn — do NOT split into two separate interactive pauses.

```bash
FINAL_ID="$(date +%Y%m%d_%H%M%S)_${METHOD}_${TOPIC_SLUG}_final"
cat > ".opencode/state/ideation/${FINAL_ID}.md" << 'EOF'
# Ideation Final Output

**Method:** {method}
**Topic:** {topic}
**Status:** approved
**Created:** {timestamp}
**Approved:** {timestamp}

## Result
{final approved output}

## Key Decisions
{decisions made during ideation}

## Assumptions
{assumptions identified}

## Open Items
{items deferred to implementation}
EOF
```

Report inline: show the final result, note the saved file, and mention that `/orchestrate` can execute it. Do NOT ask separate "Ready to implement?" and "Session summary?" questions — present both in one message.

## Resume Behavior

`/ideation resume` checks `.opencode/state/ideation/work-products/` for the most recent in-progress work and offers to continue from where it left off.

## Status Behavior

`/ideation status` shows:
- Active work products in `.opencode/state/ideation/work-products/`
- Finalized outputs in `.opencode/state/ideation/`
- Current method and topic if a session is active

## Context Creation

During ideation, if the need arises for a new rule, skill, or agent that would help the project:

1. Identify the need
2. Ask user: "This ideation would benefit from a [skill/agent/rule] for [purpose]. Create it?"
3. If yes, create it using the appropriate creator skill
4. Continue ideation with the new resource available

## Related

- `/orchestrate` — Execute an approved plan
- `/harvest-context` — Extract and manage context artifacts
- `remember` skill — Promote durable knowledge
- `wiki` skill — Persistent knowledge base