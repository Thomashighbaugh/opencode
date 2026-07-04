# The Short Leash AI Coding Method For Beating Fable

> **Source:** https://blog.okturtles.org/2026/07/short-leash-ai-method/
> **Author:** Greg Slepak (okTurtles)
> **Published:** July 2, 2026
> **Type:** Blog post — AI coding methodology
> **Context:** Culmination of over a year of research into using AI agents for security-critical software

## Summary

A methodology for using AI coding agents to produce high-quality software without sacrificing quality. Written for expert developers whose skills exceed frontier AI models in their domain. The core insight: keep the AI on a "short leash" — stay in the loop, review every diff, deny unwanted changes frequently, and never use YOLO mode.

## The Short Leash Method — Core Principles

1. **Planning phase first** — Research the task, formulate a plan, use a tasks skill to track progress and break large tasks into steps
2. **Never use YOLO mode** (aka "dangerously skip permissions")
3. **The AI never works "while you play video games"** — you must be present
4. **Use a coding agent that displays a diff** of proposed changes via the permissions prompt
5. **Analyze the proposed changes** like "some crazed person from the 20th century"
6. **Stay in the loop at all times** — do not remove yourself (the trend promoted by YouTubers)
7. **Use the diffs to keep your understanding of the codebase up-to-date** and the AI on a "short leash"
8. **DENY permissions** any time the AI is about to do something you don't want
9. **Intervene frequently** to prevent the AI from "going off the rails"
10. **Commits at the end of every subtask** — protects against the AI screwing up and deleting previously done work (the author has seen Opus do this)
11. **Final review** at the end

## Problems With "Vibe Engineering" Approaches

The author critiques the popular "12 parallel agents managed by an orchestrator" approach promoted by YouTubers:

- It is humanly impossible to build your understanding of a codebase with the "Vibe" approach
- The AI goes off the rails multiple times, and you only notice later when you try to use the software
- Code written and reviewed by Fable 5 (a frontier model) "stinks" — it works but is "horribly inefficient and ugly"
- This is especially true in niche areas without much training data
- "Contrary to marketing statements made by certain CEOs, these models are not able to think beyond their training data"

## AI Reviews — Best Practices

A PR reviewed by just a human or just an AI will have more mistakes than a PR reviewed by **both** a human and an AI.

- Use AI to review **every single PR**
- The AI must have access to sufficient context (issue, PR description, codebase, changes)
- Use the latest and greatest models available to review
- The PR description must disclose the precise models used under an "AI Disclosure" heading. This:
  1. Informs the maintainer that AI was used
  2. Lets them suggest better models if weak ones were used
  3. Signals that you're a "good guy" developer and aren't trying to "sneak AI in"
- **The PR must be reviewed by the PR 'author' if it used AI** — AI-assisted PRs are really PRs from an AI with human assistance. The human must treat their own PR as if reviewing someone else's PR, line-by-line.

## Key Quotes

> "Only professional software developers can use this method. But what's great about it is that it will lead to Fable-beating results even if you aren't using a frontier model."

> "It is humanly impossible to build your own understanding of a codebase if you use such a 'Vibe' approach."

> "Contrary to marketing statements made by certain CEOs, these models are not able to think beyond their training data."

> "AI-assisted PRs are really PRs from an AI with human assistance. Therefore, the human submitting the PR is expected to understand what they are submitting."

## Relevance to OpenCode Hubs

This methodology has direct relevance to our orchestration patterns and design philosophy:

- **Validates our non-YOLO default** — OpenCode's permission system and the `permission.ask` hook align with the "short leash" philosophy. We never auto-skip permissions.
- **Validates human-in-the-loop orchestration** — Our ralph/autopilot/team patterns keep the user in the loop via the completion guardrail (must stop after planning, no auto-implementation)
- **Validates per-subtask commits** — Our git workflow patterns encourage frequent commits, which protects against AI mistakes
- **Validates the planning-first approach** — Our `/ideation` hub separates planning from execution
- **Validates diff review** — Our `permission.ask` hook surfaces proposed changes before execution
- **Critique of parallel-agent slop** — This challenges the "swarm of 12 agents" orchestration pattern. Our swarm pattern is gated (architect-led, with QA gates between batches) but the critique is worth noting: parallel agents without tight human review produces slop.
- **AI Disclosure in PRs** — A practice we could recommend in our `/project pr` workflow
- **Review-as-linter pattern** — Treat AI review as a linter (catches common mistakes), humans catch higher-level issues

## Related Resources

- [tasks skill](https://github.com/taoeffect/tasks) — Greg's task tracking skill for AI agents
- [Crush fork](https://github.com/taoeffect/crush) — Greg's custom fork of an AI coding agent
- [okTurtles AI Usage Policy](https://github.com/okTurtles/group-income/blob/master/CONTRIBUTING.md#ai-usage-policy) — Their official policy document
- [okTurtles hiring page](https://okturtles.org/hiring/)

## Source

- URL: https://blog.okturtles.org/2026/07/short-leash-ai-method/
- Author: Greg Slepak
- Published: July 2, 2026
- License: Blog post (copyright okTurtles)