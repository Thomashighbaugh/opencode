# Serial Search — Subagent Dispatch

This file describes how to dispatch research subagents **serially** — one at a time, in sequence — so the primary agent retains full awareness of the overall goal and can adapt the plan based on what each axis uncovers.

## When to dispatch

Dispatch a subagent for each axis in the research plan. Each axis is independent — it can be fully researched from scratch without knowing the others' results. But serial dispatch lets you **adapt the plan** as results come in: if axis 2 reveals a major contradiction, you can redirect axis 3 before dispatching it.

## Serial dispatch loop

For each axis in the research plan:

1. **Dispatch** one subagent with the axis-specific prompt (see template below).
2. **Wait** for it to return its findings.
3. **Review** the findings — check for gaps, contradictions with earlier axes, or new angles that need investigation.
4. **Write** the findings to the notes directory and append to the report.
5. **Adapt** the remaining plan if needed: redirect upcoming axes, add new axes, or drop stale ones.
6. **Dispatch the next subagent** only after reviewing the previous one's output.

**Never dispatch multiple subagents simultaneously.** The point of serial dispatch is that each subagent's findings inform the next one's instructions.

## Subagent prompt template

Each subagent prompt must be self-contained — the agent has no memory of the parent conversation.

```
You are a research analyst. Your task: research one specific axis of a larger study.

**Topic:** {overall topic}
**Your axis:** {axis name and description}
**Research goals:** {what specific questions to answer on this axis}
**Geographic/time constraints:** {any from scope interview, or "none"}

Instructions:
1. Run web searches and fetch the relevant source pages.
2. For each finding, note the source URL, access date, and confidence level (High/Medium/Low per the ladder below).
3. Tag each source: **Primary** (official docs, government filings, peer-reviewed papers), **Established** (major publications, analyst firms with editorial process), or **Low** (blogs, forums, single opinions). Flag Low-tier sources visibly.
4. Critical claims (numbers, market share, projections) need 2+ sources or get confidence: Low.
5. Flag any conflicts between sources explicitly — do not silently pick one.
6. The axis definition is a starting point, not a ceiling. If you find relevant information that falls outside the stated axis but adds meaningful insight for the overall topic, include it — label it clearly and explain why it matters.
7. External files (PDFs, datasets, analyst reports, regulatory filings, whitepapers, charts) may contain valuable data. When encountered, their key content should be summarized inline — do not leave them as bare links. Use `ax` or `curl` for local downloads when needed.
8. Write findings as **prose paragraphs**, not bullet lists. Embed figures in sentences: "The market reached $4.2B in 2024 [Source]" rather than "* Market: $4.2B". Bullets are acceptable only for true enumerated lists (product names, compliance items, enumerated steps).
9. Distinguish sourced facts from your analysis: use "According to [Source]..." for direct findings and "This suggests..." or "The pattern indicates..." for your synthesis. Never present inference as fact.
10. If a topic cannot be found, write "No sources found for X" — do not guess or leave a blank.
11. Return your findings as a Markdown section ready to paste into a report.

Confidence ladder:
- High: 2+ reputable independent sources agree
- Medium: 1 reputable source (Primary or Established tier)
- Low: blog, forum, single opinion, Low-tier source, or inferred

Citation format: [Source Name](url) (accessed YYYY-MM-DD, confidence: High|Medium|Low)

Output format:
## {Section heading}
{Prose paragraphs with inline citations. Bullets only for true lists.}

> Conflicts noted: {if any}
> Gaps: {what you couldn't find}
```

## Choosing agent type

- Use **`general`** for broad search + synthesis work (most research axes).
- Use **`explore`** only when the axis is about exploring an existing local codebase or file set — not for web research.
- Use **`scientist`** for axes requiring data analysis, statistical reasoning, or quantitative synthesis.

## Handling completions

As each subagent returns:

1. Read its output immediately.
2. Review for gaps, contradictions, or new angles.
3. Append its findings section to the output report file under the appropriate heading.
4. Update the research plan if the findings warrant it.
5. Dispatch the next subagent.

If a subagent returns insufficient findings (e.g., a gap note with no data), do not fill the gap with guesses. Write the gap explicitly in the output file and note it for the Synthesis step.

## Adapting the plan mid-research

This is the key advantage of serial dispatch. After each subagent returns, ask:

- **Did this axis reveal a contradiction?** → Add a verification axis to resolve it.
- **Did this axis reveal a gap?** → Add a gap-fill axis before moving to the next planned axis.
- **Did this axis make a planned axis irrelevant?** → Drop it and note why.
- **Did this axis reveal an unexpected angle?** → Add a new axis to explore it.

Document plan changes in the report's methodology note.

## Splitting axes by type

See `references/type-router.md` for the full type taxonomy and the type-specific reference files for exact axis breakdowns. If the topic merges multiple types, combine their axis lists and deduplicate.
