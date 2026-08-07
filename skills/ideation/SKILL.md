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

When invoked without arguments (`/ideation`), list the subcommands as plain text and ask the user to choose. Do NOT call `hubMenu` or any other tool — just output the list directly. Available methods: plan, brainstorm, decomposition, refine, overhaul, deep, graph, research, ralplan, ddd, event-storming, double-diamond, jtbd, impact-mapping, spiral, spark, top-down, bottom-up, adversarial-debate, cleanroom, pwf, rpikit, hive, story-mapping, lean-canvas, constitution, quality, modularity, arch-prep, web-research, tech-eval, competitive-analysis, tree-of-thoughts, deep-thinker, opro, analyze-patterns, resume, status.

## With-Argument Behavior

Directly invoke the matching subcommand. Print the reminder, then delegate to the corresponding skill.

## Subcommand Routing

| Subcommand | Skill/Delegate | What It Does |
|------------|----------------|--------------|
| `plan` | `plan` skill | Interview-style strategic planning — clarify goals, identify constraints, break into tasks |
| `brainstorm` | inline | Free-form idea generation — diverge then converge |
| `decomposition` | inline | Break complex work into ordered, verifiable subtasks |
| `refine` | `idea-refine` skill | Diverge/converge iteration — expand ideas, then sharpen them |
| `overhaul` | `overhaul` skill | 8-dimension project audit — produce prioritized improvement plan |
| `deep` | `deep-interview` skill | Socratic interview with ambiguity gating — crystallize vague requirements |
| `graph` | `graph-thinking` skill | Visual relationship mapping — dependencies, components, tradeoffs |
| `research` | `ccg` skill | Multi-model synthesis — diverse perspectives merged into one answer |
| `ralplan` | `ralplan` skill | Consensus planning gate — validate plan is concrete enough to execute |
| `ddd` | inline | Domain-driven design — model bounded contexts, aggregates, domain events |
| `event-storming` | inline | Collaborative domain exploration via timeline, commands, events, policies |
| `double-diamond` | inline | Design Council framework — discover, define, develop, deliver |
| `jtbd` | inline | Jobs-to-be-done — frame requirements around customer functional jobs |
| `impact-mapping` | inline | Goal mapping — trace deliverables to business impact |
| `spiral` | inline | Risk-driven iterative planning — each cycle targets highest-risk items first |
| `spark` | inline | Project-aware idea sparks — improvements and expansion prompts |
| `top-down` | inline | Decompose from high-level vision into components and sub-systems |
| `bottom-up` | inline | Build up from existing primitives into composed systems |
| `adversarial-debate` | inline | Spec validation via oppositional debate — proposer vs critics |
| `cleanroom` | inline | Formal correctness — box structure decomposition and statistical testing |
| `pwf` | inline | Filesystem-as-disk planning — quality-gated convergence with recovery |
| `rpikit` | inline | Research-Plan-Implement — stakes-based rigor scaling |
| `hive` | inline | Agent swarm planning — interview, discover, produce plan.md with approval gate |
| `story-mapping` | inline | User story mapping — journey spine with release prioritization |
| `lean-canvas` | inline | Lean business model — problem, solution, metrics, competitive advantage |
| `constitution` | inline | Project governance — code, UX, performance, security principles |
| `quality` | inline | Code quality audit — complexity, duplication, naming, error handling |
| `modularity` | `@architect` agent | Module boundary analysis — detect circular dependencies, suggest reorg |
| `arch-prep` | `@architect` agent | Architecture prep for upcoming features — extension points, refactoring runway |
| `architecture` | `improve-codebase-architecture` skill | Architectural friction analysis — propose deep-module refactors |
| `grill` | `grilling` skill | Stress-test a plan with relentless one-at-a-time questioning |
| `redesign` | `redesign-existing-projects` skill | Audit and upgrade existing UI to premium design standards |
| `web-research` | inline | Multi-source web research — parallel searches, synthesize findings |
| `tech-eval` | inline | Technology evaluation — structured pros/cons comparison against alternatives |
| `competitive-analysis` | inline | Competitive landscape — feature comparison matrix |
| `tree-of-thoughts` | `tree-of-thoughts` skill | ⚠️ EXPENSIVE: Explore parallel solution branches for open-ended problems |
| `deep-thinker` | `@deep-thinker` agent | Structured thinking partner — clarify Who/What/Why, apply thinking frameworks, end with action |
| `opro` | `opro` skill | ⚠️ EXPENSIVE: Optimize prompts by testing variations against benchmarks |
| `analyze-patterns` | inline | Analyze code patterns and anti-patterns — consistencies, convention violations |
| `resume` | self (inline) | Resume last ideation session |
| `status` | self (inline) | Show current ideation state |

### Subcommand Behavior

Each subcommand follows the hub pattern:

1. **Print a terse reminder** (1-2 lines, hardcoded below — never generated dynamically)
2. **Check for prior state** in `.opencode/state/ideation/`
3. If relevant prior work exists, ask user whether to resume, start fresh, or use as context
4. **Execute** by delegating to the appropriate skill (see routing table above)
5. **Save mandatory checkpoint** after every significant iteration to `.opencode/state/ideation/work-products/`
6. **Iterate until approved** — only finalize when user explicitly says "looks good," "approved," "finalize," etc.
7. **On approval**, save final output to `.opencode/state/ideation/{timestamp}_{method}_{topic-slug}_final.md` and report inline
8. **STOP after reporting** — do NOT offer to implement, do NOT dispatch executors (see `rules/completion-guardrail.md`)

### Terse Reminders

| Subcommand | Reminder on Invoke |
|------------|-------------------|
| `plan` | Plan: Interview-style strategic planning. I'll ask clarifying questions, identify constraints, and break your goal into ordered tasks with acceptance criteria. |
| `decomposition` | Decomposition: Breaking down your task into ordered, actionable subtasks. I'll identify dependencies, define acceptance criteria for each, and produce a clear work breakdown. |
| `refine` | Refine: Diverge/converge iteration. I'll expand your idea through structured brainstorming, then help you converge on the strongest version. |
| `overhaul` | Overhaul: Analyze your project across 8 refinement dimensions and produce a prioritized, phased implementation plan. |
| `deep` | Deep: Socratic interview with ambiguity gating. I'll ask probing questions until your requirements are fully crystallized. |
| `graph` | Graph: Visual relationship mapping. I'll map dependencies, components, and tradeoffs as a graph to reveal structure you might miss linearly. |
| `research` | Research: Multi-model synthesis. I'll gather diverse perspectives on your question and merge them into a coherent, cross-referenced answer. |
| `ralplan` | Ralplan: Consensus planning gate. I'll validate that your plan is concrete enough to execute. |

---

## Shared Lifecycle

Every subcommand follows this lifecycle:

### Step 0: Check State Directory

```bash
mkdir -p .opencode/state/ideation/work-products
```

### Step 0a: Parse Flags

Check for `--quiet` flag: when present, suppress all inline progress narration. Only print the final result and any errors.

### Step 1: Check Prior Work

Before starting, scan for relevant cached work:

```bash
ls .opencode/state/ideation/work-products/ 2>/dev/null
```

If relevant prior work exists (matching topic or method):
- Ask user: "Found prior ideation work on [topic]. Resume, start fresh, or use as context?"

### Step 2: Print Method Reminder

Show the static 1-2 line description for the selected method (see Terse Reminders table above). Do NOT generate this dynamically.

### Step 3: Execute Method

Look up the subcommand in the Subcommand Routing table above, then delegate to the listed skill/agent. For `inline` entries, execute directly.

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

**IMPORTANT — auto-save is mandatory.** You MUST write intermediate work products after EVERY significant iteration. Do not skip this step. The file must follow the ISO date naming convention exactly.

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

**⚠️ COMPLETION GUARDRAIL: After reporting the result, STOP. Do NOT offer to implement. Do NOT start coding. Do NOT dispatch executor agents. The user must explicitly say "go ahead" or "implement it" before any code is written. See `rules/completion-guardrail.md`.**

**CRITICAL: The final output MUST always be saved to disk.** Do not skip the file write under any circumstances. If you've received approval, you MUST write the final output and then report it inline. The file pattern is:

```bash
FINAL_ID="$(date +%Y%m%d_%H%M%S)_${METHOD}_${TOPIC_SLUG}_final"
# ... write to .opencode/state/ideation/${FINAL_ID}.md
```

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

## Auto-Save Enforcement

The agent executing this skill MUST save work products automatically. Do not ask the user for permission to save — always save after each iteration and on finalization. The state directory is already gitignored so there is no risk of committing intermediate artifacts.

## Related

- `/orchestrate` — Execute an approved plan
- `/harvest-context` — Extract and manage context artifacts
- `remember` skill — Promote durable knowledge
- `wiki` skill — Persistent knowledge base