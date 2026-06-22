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
- Deep-dive code quality analysis before starting a refactor
- Analyzing module boundaries and planning modularity improvements
- Designing architecture runway for upcoming features
- Any situation where "think before you code" applies

## No-Argument Behavior

When invoked without arguments (`/ideation`), list the subcommands as plain text and ask the user to choose. Do NOT call `hubMenu` or any other tool — just output the list directly. Available methods: plan, brainstorm, decomposition, refine, overhaul, deep, graph, research, ralplan, ddd, event-storming, double-diamond, jtbd, impact-mapping, spiral, top-down, bottom-up, adversarial-debate, cleanroom, pwf, rpikit, hive, story-mapping, lean-canvas, constitution, quality, modularity, arch-prep, resume, status.

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

### `/ideation overhaul` — Project Overhaul

**Method:** `overhaul`

Analyze an existing project across configurable dimensions and produce a prioritized, phased implementation plan. Select from: architecture, performance, security, code quality/tech debt, testing, dependencies, developer experience. Use `overhaul:dim` to target a single dimension (e.g., `/ideation overhaul:arch`, `/ideation overhaul:sec`).

**Reminder shown to user:**
> Overhaul: Analyze your project across 8 refinement dimensions and produce a prioritized, phased implementation plan.

**Delegates to:** `overhaul` skill

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

### `/ideation quality` — Code Quality Audit

**Method:** `quality`

Deep-dive code quality analysis across the codebase. Identifies complexity hotspots, duplication clusters, naming violations, error handling gaps, and dead code. More focused than a full `overhaul` — zeroes in on code quality dimensions specifically.

**Reminder shown to user:**
> Quality: Deep-dive code quality audit. I'll scan for complexity hotspots, duplication, naming issues, and error handling gaps across your codebase.

**Delegates to:** inline (executed directly)

**Process:**
1. Scan the codebase using static analysis techniques
2. Identify and categorize findings: complexity (high cyclomatic complexity, deep nesting), duplication (similar code blocks across files), naming (inconsistencies, unclear names), error handling (empty catches, swallowed errors, missing validation), dead code (unused exports, orphaned files, stale comments)
3. For each finding, provide file paths, severity, and concrete improvement suggestions
4. Prioritize findings into quick wins vs. larger efforts
5. Output a structured quality report saved to `.opencode/state/ideation/work-products/`
6. Can be handed off to `/project simplify`, `/project refactor`, or `/orchestrate` for execution

---

### `/ideation modularity` — Modularity Analysis

**Method:** `modularity`

Analyze module boundaries, coupling, and cohesion across the codebase. Detects circular dependencies, mixed concerns, god modules, and suggests reorganization for cleaner module isolation. Uses the `@architect` agent for structural analysis.

**Reminder shown to user:**
> Modularity: I'll analyze module boundaries, coupling, and cohesion. I'll detect circular dependencies, god modules, and suggest a reorganization plan.

**Delegates to:** `@architect` agent

**Process:**
1. Map the codebase's module/directory structure
2. Analyze import/export graphs to quantify coupling between modules
3. Detect circular dependencies, god modules (files >800 lines or importing from too many places), mixed concerns (e.g., data access mixed with UI logic), leaky abstractions
4. Produce a modularity report with: coupling graph (text-based), problem modules ranked by severity, recommended boundary changes, step-by-step migration plan
5. Output saved to `.opencode/state/ideation/work-products/`

**Output example:**
```markdown
## Modularity Report

### Coupling Summary
- Module A → depends on 12 other modules (highly coupled)
- Module B → has no clear boundary (mixes concerns)
- Circular dependency: utils ←→ helpers

### Recommendations
1. Extract `validation` from `utils.ts` → new `validation/` module
2. Split `components/BigComponent.tsx` (1200 lines) into 4 focused components
3. Break circular dependency by introducing a shared types module
```

---

### `/ideation arch-prep` — Architecture Preparation

**Method:** `arch-prep`

Architecture preparation for upcoming features. Before writing code for a new feature, use this to design the architecture runway: identify extension points, plan module additions, anticipate what needs refactoring, and produce a blueprint. Uses the `@architect` agent for structural design.

**Reminder shown to user:**
> Arch-prep: I'll design the architecture runway for your upcoming feature. Extension points, module plan, refactoring needs, and implementation order.

**Delegates to:** `@architect` agent

**Process:**
1. Understand the upcoming feature requirements (take user description as input)
2. Analyze the current codebase architecture for integration points
3. Design the architectural changes needed: where new modules/functions slot in, what refactoring is required first, what interfaces/abstractions to introduce
4. Identify potential risks and trade-offs
5. Produce an architecture blueprint with: system context (how the feature fits), module plan (new/modified modules), refactoring runway (what must change first), extension points (interfaces, hooks, plug-in points), implementation order (what to build in what sequence)
6. Output saved to `.opencode/state/ideation/work-products/`

**Usage:**
- `/ideation arch-prep "multi-tenant auth"` — Prep architecture for adding multi-tenant authentication
- `/ideation arch-prep "real-time notifications"` — Prep architecture for adding WebSocket-based notifications

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
| `overhaul` | `overhaul` |
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