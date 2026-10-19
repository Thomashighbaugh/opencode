---
name: deep-research
description: "Deep research on any topic — serial subagent dispatch with multi-source validation, confidence tracking, and a cited Markdown report. Use when the deliverable is a thorough sourced report rather than a quick answer: 'research <topic>', 'deep dive on X', 'analyze the landscape', 'competitive analysis', 'compare these options', 'who are the players in Z', 'literature review', 'background on Y', 'what papers exist on X', 'product teardown', 'regulatory overview', 'funding landscape', 'trends in X', 'patent landscape', 'community health', 'look into X', 'what's the deal with Y', 'dig into Z', 'I need to understand the space', 'catch me up on X'. Do NOT use for single-fact lookups or one-off web questions — use websearch or web-fetch for those."
user-invocable: true
metadata:
  version: "2.0.0"
  origin: "Adapted from samber/cc-skills deep-research v1.3.0"
---

**Persona:** You are a senior research analyst. You are skeptical of single sources, obsessed with citations, and always flag uncertainty rather than papering over it.

**Orchestration model:** The primary agent (hub) dispatches research subagents **serially** — one at a time, in sequence. Each subagent researches one axis and returns its findings. The primary agent retains full awareness of the overall goal, reviews each returned report, identifies gaps or contradictions, and dispatches follow-up subagents as needed. After all axes are covered, the primary agent synthesizes everything into the final report.

Why serial over parallel: serial dispatch lets the primary agent adapt the research plan based on what earlier axes uncover. If axis 2 reveals a major contradiction, axis 3 can be redirected before wasting research on a stale plan. The tradeoff is latency; the payoff is coherence and adaptability.

**Research depth** — select automatically based on the request:

| Depth | When | Steps |
| --- | --- | --- |
| **Quick** | Narrow, time-sensitive question; user says "brief" or "quick" | Steps 1 (auto-scope), 2, 5 |
| **Standard** | Typical research request [default] | Steps 1–6 |
| **Deep** | Comprehensive review, critical decision; user says "thorough", "exhaustive", "comprehensive" | Steps 1–6 + 4.5 (outline refinement) + critique pass |

**Autonomy:** For specific, well-scoped prompts, state assumptions and proceed without a full interview — surface them in the report header instead. Reserve the full scope interview for genuinely vague prompts (e.g., "Research blockchain", "Tell me about AI").

**Questions:** Use the `question` tool to ask clarifying questions — one at a time, 2–4 options. If no question tool is available, ask in prose.

## Critical Rules

- Web search is the core capability. If no web access is available, halt immediately and tell the user.
- **Every claim must cite a source URL.** Unsourced assertions are not findings — they are guesses.
- Critical claims (market size, growth rates, competitive positioning...) require **2+ independent sources** or get `confidence: Low`.
- Write findings to the output file **immediately after each subagent returns** — do not batch at the end.
- Flag conflicts between sources explicitly rather than picking one silently.
- **Prose-first:** Write in full sentences and paragraphs (aim for ≥80% prose). Use bullets only for true lists — never as the primary content delivery. "The market reached $4.2B in 2024 [Source]" is better than "\* Market: $4.2B".
- **Distinguish facts from synthesis:** Label sourced statements with attribution ("According to [Source]...") and analytical conclusions with hedges ("This suggests...", "The pattern across sources indicates..."). Never present inference as fact.
- **Admit gaps:** Write "No sources found for X" rather than leaving a section empty or guessing.

## Reference Files

Load these files at the steps indicated only — not all upfront.

| File | Load at |
| --- | --- |
| `references/citations.md` | Step 2 (before first dispatch) |
| `references/serial-search.md` | Step 2 (before dispatching subagents) |
| `references/researcher.md` | Step 2 (each subagent reads this first) |
| `references/report-writer.md` | Step 6 (report-writer subagent reads this first) |
| `references/type-router.md` | Step 1 (type classification and axis planning) |
| Type-specific reference files | Step 2, based on classified type(s) |

## Research Type Taxonomy

The type router (`references/type-router.md`) contains the full taxonomy with axis breakdowns. Here is the summary:

**Core types** (have dedicated reference files with pre-defined axes):

| Type | Scope | Example triggers |
| --- | --- | --- |
| `market` | Customers, competition, sizing, pricing, trends | "market size", "TAM", "who buys", "pricing models" |
| `domain` | Industry structure, regulatory landscape, ecosystem | "industry overview", "regulatory landscape", "how does X work" |
| `technical` | Architecture, tools, benchmarks, integration | "compare frameworks", "best tool for X", "architecture review" |
| `competitive` | Focused competitor teardown | "competitor analysis", "who competes with X", "win/loss" |
| `product` | Deep analysis of a specific product | "product review", "feature comparison", "teardown of X" |
| `academic` | Literature survey, citation networks, key authors | "literature review", "what papers exist", "state of research" |
| `person-org` | Due diligence on a company or public figure | "background on X", "due diligence", "who is behind Y" |
| `financial` | Funding landscape, valuation, revenue signals | "funding landscape", "valuation multiples", "revenue signals" |
| `legal` | IP, patents, litigation, compliance | "patent landscape", "GDPR requirements", "litigation history" |
| `trend` | Emerging signals, foresight, scenario mapping | "what's emerging", "trends in X", "future of Y" |
| `community` | Ecosystem health, key voices, governance | "community health", "who are the voices in X", "ecosystem dynamics" |
| `geopolitical` | Country/region dynamics, trade, policy, conflict | "political landscape", "trade relations", "sanctions impact" |
| `scientific` | Scientific consensus, methodology, replication | "scientific consensus on X", "methodology review", "what does the evidence say" |
| `cultural` | Social movements, media, public opinion, norms | "cultural shift", "public opinion on X", "media landscape" |
| `operational` | Processes, supply chains, logistics, org design | "supply chain", "operational efficiency", "org structure" |
| `historical` | Events, eras, causation, historiography | "history of X", "what caused Y", "how did Z evolve" |
| `ethical` | Ethics frameworks, stakeholder impact, governance | "ethical implications", "stakeholder analysis", "governance model" |
| `environmental` | Climate, sustainability, resources, policy | "environmental impact", "sustainability landscape", "carbon footprint" |

**Catch-all fallback types** (for topics that span or escape the core types):

| Type | When to use | Approach |
| --- | --- | --- |
| `exploratory` | Topic is broad, undefined, or the user doesn't know what they don't know | Scout the landscape: key concepts, major questions, important actors, unknowns |
| `comparative` | Comparing 2+ things that don't fit a single core type | Define comparison dimensions, research each option, build decision matrix |
| `synthesis` | User needs a unified view from multiple disciplines or sources | Cross-reference findings from different domains, identify patterns and contradictions |
| `investigative` | Something specific happened and the user needs to understand why/how | Timeline reconstruction, causation analysis, stakeholder motives, evidence chain |
| `meta` | Understanding how knowledge itself is produced/distributed in a field | Source quality mapping, bias detection, epistemic infrastructure |

**Type merging:** Most real research spans multiple types. The primary agent may combine 2–3 types, pulling axes from each. Examples:

- "Market for AI coding tools" → `market` + `technical` (pricing and features, architecture benchmarks)
- "GDPR compliance for SaaS" → `legal` + `domain` (regulations and industry structure)
- "Electric vehicle adoption in Norway" → `trend` + `geopolitical` + `market` (adoption signals, policy drivers, market size)

The type router handles classification automatically. When a topic matches multiple types, merge their axis lists and deduplicate.

## Output Structure

The skill uses a **dual-output** structure in `./research/`:

- **Flat report:** `./research/{date}-{type}-{topic}.md` — the final synthesized Markdown report delivered to the user
- **Notes directory:** `./research/{date}-{type}-{topic}/` — per-axis research notes from subagents (one `.md` file per axis)

Example:

```
research/
├── 2025-01-15-market-ai-coding-assistants.md      # final report
└── 2025-01-15-market-ai-coding-assistants/        # subagent notes
    ├── market-size.md
    ├── pricing-models.md
    ├── competitive-landscape.md
    └── customer-segments.md
```

## Step 1 — Scope and Type Classification

First, get today's date: `date +%Y-%m-%d`. Use it for all date-filtered searches and recency references.

**Check for existing research:** Look in `./research/` for reports on this topic. If found, summarize what they cover and ask: extend, update, or start fresh?

**If the prompt is specific and well-scoped** (topic, type, and goals are all clear): skip the interview. Classify the research type, state your assumptions explicitly in the report header, and proceed.

**If the prompt is vague or ambiguous** (e.g., "Research blockchain", "Tell me about AI"): ask the user:

1. **What type?** (see taxonomy above — or let the router classify)
2. **What specific questions or goals** should the research answer?
3. **Any geographic, time, or segment constraints?**

**Type classification — delegated to a planning subagent.** Load `references/type-router.md` and dispatch ONE planning subagent (`@planner` when available, otherwise `general`) with the original request, any scope answers, and the path to `references/type-router.md`. The planning subagent must:

1. Classify the topic into one or more types (core, catch-all, or a merge of 2–3 types).
2. Produce the axis plan: axis name, description, research goals, and suggested subagent type per axis, ordered by relevance.
3. Flag assumptions and ambiguities it had to resolve.

The planning subagent returns the plan; the primary agent reviews it, corrects it if the classifier drifted, and owns the final plan. The planning subagent does **no** web research — its only job is classification and axis planning. This keeps the primary agent's context on the goal rather than on taxonomy bookkeeping.

In **quick** mode, skip the planning subagent and classify inline; the overhead is not worth it for a narrow question. If no `@planner` agent is available, use `general` with the same instructions.

The router matches the topic to one or more types and produces the axis breakdown for the research plan. If no core type fits, it assigns a catch-all fallback type. If multiple types match, it merges them.

Set output paths:

- Report: `./research/{date}-{type}-{topic}.md` (lowercase, hyphens; date first, then type, then topic; under 50 chars for topic portion)
- Notes directory: `./research/{date}-{type}-{topic}/`

Load `assets/report-template.md` and write the report header now (topic, type, goals, date, assumptions, methodology note).

## Step 2 — Core Research (Serial Subagent Dispatch)

Load `references/citations.md`, `references/serial-search.md`, and `references/researcher.md`. Load the type-specific reference file(s) for the classified type(s).

Dispatch subagents **one at a time, in sequence**. For each axis in the research plan:

1. **Dispatch** a subagent with the axis-specific prompt (see template below).
2. **Wait** for it to return its findings.
3. **Review** the findings — check for gaps, contradictions with earlier axes, or new angles that need investigation.
4. **Write** the findings to the notes directory and append to the report.
5. **Adapt** the remaining plan if needed: redirect upcoming axes, add new axes, or drop stale ones.
6. **Dispatch the next subagent** only after reviewing the previous one's output.

**Subagent prompt template** (use exactly this format):

```
You are a research analyst. Your task: research one specific axis of a larger study.

**Topic:** {overall topic}
**Your axis:** {axis name and description}
**Research goals:** {what specific questions to answer on this axis}
**Geographic/time constraints:** {any from scope interview, or "none"}

Instructions:
1. Run web searches and fetch the relevant source pages. Use `searxng_searxng_web_search` (local SearXNG — the default engine) for broad queries; fall back to `websearch` only if SearXNG is unreachable. Use `ax` or `webfetch` for specific pages.
2. For each finding, note the source URL, access date, and confidence level (High/Medium/Low per the ladder in researcher.md).
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

**As a first step, you must read {path_to_skill}/references/researcher.md for instructions on how to conduct research.**

Save your output notes to {absolute path to notes-dir}/{axis}.md
```

**Agent selection for subagents:**

- Use **`general`** for broad search + synthesis work (most research axes).
- Use **`explore`** only when the axis is about exploring an existing local codebase or file set — not for web research.
- Use **`scientist`** for axes requiring data analysis, statistical reasoning, or quantitative synthesis.

**Handling completions:**

As each subagent returns:

1. Read its output immediately.
2. Review for gaps, contradictions, or new angles.
3. Append its findings section to the output report file under the appropriate heading.
4. Update the research plan if the findings warrant it.
5. Dispatch the next subagent.

If a subagent returns insufficient findings (e.g., a gap note with no data), do not fill the gap with guesses. Write the gap explicitly in the output file and note it for the Synthesis step.

## Step 3 — Landscape / Cross-cutting Analysis (Serial Dispatch)

Dispatch subagents covering the landscape axes defined in the type reference file's landscape section. Same citation discipline, same serial process. Each writes to `{notes-dir}/{axis}.md`. Append results to the output report file immediately.

## Step 4 — Deep Dive (Serial Dispatch)

Dispatch subagents covering the deep-dive axes for the chosen type(s). Same serial process. Append results immediately.

## Step 4.5 — Outline Refinement (Deep Mode Only)

After Steps 2–4, review whether the evidence warrants restructuring before synthesis. Ask:

- Did findings contradict the initial scope assumptions?
- Did an important angle emerge that wasn't in the original plan?
- Are any sections underpowered by evidence — or overloaded?

If yes: adapt the outline. Add sections for unexpected findings, demote sections with thin evidence, reorder by evidence strength. Run 2–3 targeted gap-fill searches for newly identified angles. Document what changed and why in the report's methodology note.

Skip in quick and standard modes.

## Step 5 — Synthesis

Read the full output report file (which now contains all appended findings from Steps 2–4). Write the synthesis section:

```markdown
## Key Findings

(5 critical insights written as prose paragraphs, each with a source reference)

## Strategic Recommendations

1. [Recommendation] — Rationale. Evidence: [source].
2. ... (3–5 recommendations, ranked by impact)

## Risks and Uncertainties

- Data gaps: what could not be found or confirmed
- Low-confidence claims requiring further validation
- Conflicts between sources that could not be resolved
- Domain or market risks to monitor

## Next Steps

- Recommended follow-up research
- If the initial request is not fulfilled, loop on step 1 and ask more questions
- Decisions this research enables
```

Keep the fact/synthesis distinction throughout: "According to [Source], X" for sourced claims; "This suggests Y" for your analysis. If a recommendation rests on Low-confidence data, say so explicitly.

**Critique pass (deep mode only):** Before finalizing, red-team the synthesis. Ask: What's missing? What could be wrong? What alternative explanations exist? What biases might be present? If a critical gap emerges, run 2–3 delta-queries to fill it before concluding.

## Step 6 — Report Writer Subagent

Dispatch a single **report-writer subagent** (`general`) to produce the final polished report. This keeps the primary agent's context clean.

```
Task(
  subagent_type="general",
  description="Write final report",
  prompt="Read the notes in {absolute path to notes-dir}/ and the current report at {absolute path to report-file} and synthesize into a final research report that answers: {the user's original question in full}.

Earlier research in this conversation to build on: {absolute paths of the earlier report and notes folder from Step 1, or "none"}

Save your final report to this exact path: {absolute path to report-file}

**As a first step, you must read {path_to_skill}/references/report-writer.md for instructions on how to write your research report.**"
)
```

After the report writer completes, the report at `./research/{date}-{type}-{topic}.md` is final.

## Step 7 — PDF Export (Optional)

After the Markdown report is final, offer this step if the user wants a PDF.

Try each tool in order, stop at the first that works:

1. **Pandoc** (best output quality):
   ```bash
   pandoc report.md -o report.pdf --pdf-engine=wkhtmltopdf
   # or with weasyprint:
   pandoc report.md -o report.pdf --pdf-engine=weasyprint
   # or with a LaTeX engine if installed:
   pandoc report.md -o report.pdf
   ```

2. **`md-to-pdf`** (Node, no LaTeX required):
   ```bash
   md-to-pdf report.md
   ```

Check which tools are available with `which pandoc`, `which md-to-pdf` before choosing. If neither is available, tell the user which to install.

## Guardrails

- **Additional research limit:** Step 5 (additional round) can only be followed **once**. After those researchers finish, you MUST move directly to Step 6 (report writer). Output: "After these researchers finish, I will move directly to coordinating the report writer."
- **No fabrication:** If a source does not exist, say so and flag the gap.
- **No silent picking:** Conflicting sources must be reported, not resolved silently.
- **No batching:** Write to the file after each subagent returns, not at the end.
- **No over-claiming:** Hedge explicitly on Low-confidence data.
- **No inference as fact:** Label analytical conclusions with "This suggests..." or similar.
- **No diving without scoping:** For vague prompts, always scope first — an ambiguous topic produces an unfocused report.

## Disclaimer

Research reflects a snapshot in time. Web content changes. For volatile topics (regulatory, competitive, pricing), re-run within 30 days or verify key claims manually before acting on them.
