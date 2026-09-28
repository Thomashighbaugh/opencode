---
description: "List planning and research methodologies available in this plugin"
---

# Planning & Ideation

This plugin ports the planning/research methodologies from an OpenCode "Hubs" `/ideation` menu. Each row below is its own hidden slash command — type it directly (autocomplete won't suggest it, but it runs).

| Command | Purpose |
|---|---|
| `/plan` | Interview-style strategic planning — clarify goals, break into an ordered, verifiable task list |
| `/brainstorm` | Free-form idea generation — diverge (generate without judgment), then converge (cluster, prioritize) |
| `/refine` | Diverge/converge iteration on an *existing* idea — expand, then sharpen, over 2-3 cycles |
| `/overhaul` | 8-dimension project audit (architecture, performance, security, quality, testing, deps, DX, docs) → phased improvement plan |
| `/deep-interview` | Socratic interview with ambiguity gating — crystallize a vague request into concrete requirements |
| `/tree-of-thoughts` | ⚠️ Expensive — explore parallel solution branches for a genuinely open-ended problem |
| `/opro` | ⚠️ Expensive — optimize a reused prompt by testing variations against a benchmark |
| `/grill` | Stress-test a plan with relentless one-at-a-time Socratic questioning before implementation |
| `/redesign` | Audit and upgrade an existing UI away from generic "AI slop" visual patterns |
| `/architecture` | Architectural friction analysis — propose deep-module refactors (Ousterhout's deep-module principle) |
| `/arch-prep` | Design the architectural runway for an upcoming feature before coding starts (spawns an independent architecture review) |
| `/web-research` | Multi-source web research — parallel searches, synthesize into a structured report |
| `/tech-eval` | Structured pros/cons comparison of a technology against its alternatives |
| `/competitive-analysis` | Competitive landscape — feature comparison matrix across competitors |
| `/decomposition` | Break an already-clear task into an ordered, verifiable subtask list (no interview phase) |
| `/custom-method arg:<method-name>` | Run any other named structured-thinking method (DDD, event storming, double diamond, JTBD, impact mapping, lean canvas, story mapping, etc.) by name |

Use `/plan` or `/decomposition` before handing work to an execution plugin; use `/grill` to stress-test the result first.
