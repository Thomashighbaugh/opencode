# Type Router — Research Type Classification and Axis Planning

Load this file at Step 1 to classify the research topic into one or more types, then use the type-specific reference files for axis breakdowns.

## Classification Process

1. **Read the topic and goals.** What is the user actually trying to learn?
2. **Match against the type table below.** Score each type: does the topic's primary question fall within this type's scope?
3. **Handle multi-type matches.** Most real research spans 2–3 types. Merge their axis lists and deduplicate.
4. **Assign catch-all if no core type fits.** Use the fallback types when the topic doesn't match any core type.
5. **Produce the axis plan.** Combine axes from all matched types, ordered by relevance to the user's goals.

## Core Types

Each core type has a dedicated reference file with pre-defined axes. Load the reference file for the matched type(s) at Step 2.

| Type | Scope | When to use | Reference file |
| --- | --- | --- | --- |
| `market` | Customers, competition, sizing, pricing, trends | "market size", "TAM", "who buys", "pricing models", "market share" | `references/market.md` |
| `domain` | Industry structure, regulatory landscape, ecosystem | "industry overview", "regulatory landscape", "how does X industry work" | `references/domain.md` |
| `technical` | Architecture, tools, benchmarks, integration | "compare frameworks", "best tool for X", "architecture review", "performance benchmarks" | `references/technical.md` |
| `competitive` | Focused competitor teardown | "competitor analysis", "who competes with X", "win/loss analysis" | `references/competitive.md` |
| `product` | Deep analysis of a specific product | "product review", "feature comparison", "teardown of X" | `references/product.md` |
| `academic` | Literature survey, citation networks, key authors | "literature review", "what papers exist on X", "state of research" | `references/academic.md` |
| `person-org` | Due diligence on a company or public figure | "background on X", "due diligence", "who is behind Y" | `references/org.md` |
| `financial` | Funding landscape, valuation, revenue signals | "funding landscape", "valuation multiples", "revenue signals" | `references/financial.md` |
| `legal` | IP, patents, litigation, compliance | "patent landscape", "GDPR requirements", "litigation history" | `references/legal.md` |
| `trend` | Emerging signals, foresight, scenario mapping | "what's emerging", "trends in X", "future of Y" | `references/trend.md` |
| `community` | Ecosystem health, key voices, governance | "community health", "who are the voices in X", "ecosystem dynamics" | `references/community.md` |
| `geopolitical` | Country/region dynamics, trade, policy, conflict | "political landscape", "trade relations", "sanctions impact", "election analysis" | `references/geopolitical.md` |
| `scientific` | Scientific consensus, methodology, replication | "scientific consensus on X", "methodology review", "what does the evidence say" | `references/scientific.md` |
| `cultural` | Social movements, media, public opinion, norms | "cultural shift", "public opinion on X", "media landscape" | `references/cultural.md` |
| `operational` | Processes, supply chains, logistics, org design | "supply chain analysis", "operational efficiency", "org structure" | `references/operational.md` |
| `historical` | Events, eras, causation, historiography | "history of X", "what caused Y", "how did Z evolve" | `references/historical.md` |
| `ethical` | Ethics frameworks, stakeholder impact, governance | "ethical implications", "stakeholder analysis", "governance model" | `references/ethical.md` |
| `environmental` | Climate, sustainability, resources, policy | "environmental impact", "sustainability landscape", "carbon footprint" | `references/environmental.md` |

## Catch-All Fallback Types

When no core type fits, assign one of these fallback types. These have no dedicated reference file — derive axes from the topic and goals.

| Type | When to use | Approach |
| --- | --- | --- |
| `exploratory` | Topic is broad, undefined, or the user doesn't know what they don't know | Scout the landscape: key concepts, major questions, important actors, unknowns. Produce a map of the territory rather than a deep dive. |
| `comparative` | Comparing 2+ things that don't fit a single core type | Define comparison dimensions from the user's goals, research each option against those dimensions, build a decision matrix. |
| `synthesis` | User needs a unified view from multiple disciplines or sources | Cross-reference findings from different domains, identify patterns and contradictions, produce a unified narrative. |
| `investigative` | Something specific happened and the user needs to understand why/how | Timeline reconstruction, causation analysis, stakeholder motives, evidence chain. Follow the evidence. |
| `meta` | Understanding how knowledge itself is produced/distributed in a field | Source quality mapping, bias detection, epistemic infrastructure, who funds/produces the research. |

## Type Merging

Most real research spans multiple types. When the topic matches 2–3 core types:

1. **Identify the primary type** — the one that most directly answers the user's core question.
2. **Merge axes** from all matched types, ordered by relevance to the user's goals.
3. **Deduplicate** overlapping axes (e.g., "regulatory landscape" appears in both `legal` and `domain`).
4. **Use the primary type's reference file** for the report template structure; pull sections from secondary types as needed.

### Common merge patterns

| Topic | Merged types | Rationale |
| --- | --- | --- |
| "Market for AI coding tools" | `market` + `technical` | Pricing and features (market) + architecture benchmarks (technical) |
| "GDPR compliance for SaaS" | `legal` + `domain` | Regulations (legal) + industry structure (domain) |
| "Electric vehicle adoption in Norway" | `trend` + `geopolitical` + `market` | Adoption signals (trend) + policy drivers (geopolitical) + market size (market) |
| "Open-source sustainability" | `community` + `financial` + `ethical` | Ecosystem health (community) + funding models (financial) + governance ethics (ethical) |
| "mRNA vaccine landscape" | `scientific` + `market` + `legal` | Research consensus (scientific) + market size (market) + patent landscape (legal) |
| "Remote work culture shift" | `cultural` + `trend` + `operational` | Social norms (cultural) + emerging signals (trend) + process changes (operational) |
| "Bitcoin regulation in the EU" | `legal` + `geopolitical` + `financial` | Regulatory framework (legal) + policy dynamics (geopolitical) + market impact (financial) |
| "History of CRISPR" | `historical` + `scientific` + `ethical` | Timeline and causation (historical) + methodology (scientific) + ethical debates (ethical) |

## Ambiguity Resolution

When the topic is too vague to classify confidently:

1. **Ask the user** — "What specifically do you want to learn about {topic}?"
2. **Default to `exploratory`** — scout the landscape and produce a map of the territory.
3. **State assumptions** — "Assuming type=market, scope=global, goals=TAM sizing and growth drivers."

## Axis Planning

After classification, produce the axis plan for the research:

1. Load the type-specific reference file(s) for matched types.
2. Extract the axis lists from each type's Step 2/3/4 sections.
3. Merge and deduplicate axes across types.
4. Order axes by relevance to the user's goals — most important first.
5. For each axis, define: name, description, research goals (what specific questions to answer).
6. Assign an agent type to each axis: `general` (default), `explore` (local codebase), `scientist` (quantitative).

The axis plan is the dispatch sequence for Step 2–4. The primary agent reviews and adapts it after each subagent returns.
