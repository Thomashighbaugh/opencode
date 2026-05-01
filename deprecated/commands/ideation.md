---
description: "Planning, research, and ideation hub — pick a method, develop your idea, approve it, hand off to orchestration"
invoke: ideation
argument-hint: "[plan|refine|deep|graph|research|ralplan] [description]"
---

# Ideation

Unified entry point for all planning and research methods. Pick a method, get a terse reminder, develop your idea iteratively, and export an approved result.

## Behavior

### With Arguments

Directly invoke the matching subcommand. Skip the menu.

### Without Arguments

Use the `hubMenu` tool with `action: "menu"` and `hub: "ideation"` to get the interactive menu JSON, then pass the result to the `question` tool to present it.

After the user selects, invoke the `ideation` skill with the selected subcommand (plus any topic the user provides after).

## Subcommand Delegation

| Selection | Skill | Reminder |
|-----------|-------|----------|
| `plan` | plan | Interview-style strategic planning. I'll ask clarifying questions, identify constraints, and break your goal into ordered tasks with acceptance criteria. |
| `refine` | idea-refine | Diverge/converge iteration. I'll expand your idea through structured brainstorming, then help you converge on the strongest version. |
| `deep` | deep-interview | Socratic interview with ambiguity gating. I'll ask probing questions until your requirements are fully crystallized. |
| `graph` | graph-thinking | Visual relationship mapping. I'll map dependencies, components, and tradeoffs as a graph to reveal structure you might miss linearly. |
| `research` | ccg | Multi-model synthesis. I'll gather diverse perspectives on your question and merge them into a coherent, cross-referenced answer. |
| `ralplan` | ralplan | Consensus planning gate. I'll validate that your plan is concrete enough to execute, and if not, run an interview to sharpen it first. |
| `resume` | — | Load most recent in-progress work from `.opencode/state/ideation/work-products/` |
| `status` | — | List state files in `.opencode/state/ideation/` |

## Task

Invoke the `ideation` skill with: `$ARGUMENTS`