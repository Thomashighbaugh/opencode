---
name: technical-writing-taxonomy
description: Classify and shape technical writing across the full range of CS/software genres — tutorials, explainers, bug hunts, postmortems, internals series, build-alongs, release notes, launch posts, concept histories, comparisons, essays, RFCs, interactive explainers, and more. Use when planning, drafting, reviewing, or classifying any developer-facing technical content (blog posts, engineering blogs, docs, changelogs, papers-adjacent writing), when the common 8-type blog taxonomy is too narrow, or when deciding what form a piece of technical writing should take.
level: 2
license: MIT
---

# Technical Writing Taxonomy

The form map for technical writing in computer science and software development. Use it to name
what a piece of writing is, choose what form a new piece should take, or check that a draft's
structure matches its genre's conventions.

## Workflow

1. **Identify the piece's job.** Read `references/taxonomy.md` and find which of the 8 groupings
   the piece belongs to: practice-transfer, knowledge-transfer, experience-transfer, opinion &
   industry, tool & product, community & career, formal genres, or interactive/non-prose.
2. **Name the dominant type.** Every real piece is one dominant type plus zero-to-two supporting
   modes. Naming the dominant type first prevents the most common failure: a draft that drifts
   between genres (tutorial that becomes reference, explainer that becomes opinion).
3. **Apply the type's conventions.** The reference lists each type's shape and its signature
   failure mode. Check the draft against them.
4. **Attach cross-cutting modes where relevant.** Series, interview/Q&A, annotated code/diff,
   live narrative, roundup — these modify the dominant type rather than replace it.

## Routing rule

This skill is the **form map**, not the drafting engine. When the piece is a long-form developer
blog post or article and a drafting skill is available (e.g. `technical-article-writer`), use this
taxonomy to pick the form, then hand off to the drafting skill for the write. When the piece falls
outside that skill's 8 types (postmortem, internals series, release notes, concept history, X-vs-Y
comparison, build-along, launch post), this taxonomy is the primary guide.

## Quick recognition table

| If the reader should leave able to… | Grouping | Examples |
|-------------------------------------|----------|----------|
| do something | Practice-transfer | tutorial, how-to, recipe, setup guide, migration guide, bug hunt, optimization journey |
| understand something | Knowledge-transfer | explainer, internals post, X-from-scratch build-along, paper explainer, concept history, X-vs-Y |
| inherit your judgment | Experience-transfer | postmortem, retrospective, how-we-built-it, rewrite story, failed experiment, trade study, war story |
| update their position | Opinion & industry | essay, rant, tech-strategy analysis, trend report, prediction, rebuttal |
| evaluate or adopt | Tool & product | release notes, launch post, tool review, benchmark, comparison matrix |
| relate | Community & career | career narrative, mentorship essay, conference recap, reading list |
| comply / specify / operate | Formal genres | reference docs, RFC/design doc, whitepaper, runbook, book, talk transcript |
| play | Interactive & non-prose | interactive explainer, notebook post, diagram-first essay, cheatsheet, video essay |

## Reference

- `references/taxonomy.md` — the full taxonomy: every type with its shape, signature failure mode,
  and the cross-cutting modes that modify any type.

The source digest that produced this taxonomy:
[[context/research/technical-article-writer/2026-10-19]] (samber/cc-skills technical-article-writer
+ gap analysis).
