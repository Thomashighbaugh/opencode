import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "deep-research",
  description: "Serial subagent research — multi-source, cited report on any topic",
  reminder: "Deep research with serial subagent dispatch, citations, and a synthesized report.",
  skill: "deep-research",

  detailedDescription: `Deep research pipeline that dispatches research subagents serially — one at a time, in sequence — so the primary agent retains full awareness of the overall goal and adapts the plan as findings come in.

1. Scope and classify — interview the user (if vague) or auto-scope (if specific), then dispatch a planning subagent to classify the research type using the expanded taxonomy (18 core types + 5 catch-all fallbacks) and produce the axis plan. The primary agent reviews and owns the plan.
2. Serial dispatch — for each axis, dispatch one subagent, wait for its findings, review for gaps/contradictions/new angles, adapt the remaining plan, then dispatch the next. Never dispatch multiple simultaneously.
3. Landscape and deep dive — serial dispatch for cross-cutting and deep-dive axes.
4. Synthesis — the primary agent reads all findings, reconciles conflicts, and writes the synthesis section.
5. Report writer — dispatch a final subagent to produce the polished report from all notes.

Every claim must cite a source URL with confidence level and tier. Conflicting sources are surfaced, not silently resolved. Findings are written to the output file immediately after each subagent returns.

The type router auto-classifies the topic into one or more types and merges their axis lists. Types: market, domain, technical, competitive, product, academic, person-org, financial, legal, trend, community, geopolitical, scientific, cultural, operational, historical, ethical, environmental. Catch-all fallbacks: exploratory, comparative, synthesis, investigative, meta.

Use when the deliverable is a thorough sourced report rather than a quick answer. For single-fact lookups, use websearch or web-fetch directly.`,

  tools: ["loadSkill", "task", "bash"],
  relatedSkills: ["wiki"],
  rules: ["efficiency-first"],
}

export default spec
