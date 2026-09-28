import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_LOADSKILL_BASH } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "insights",
  description: "Session-history analysis — work patterns, tool usage, friction points, strategic recommendations from your OpenCode usage",
  reminder: "Analyze session history and produce an insights report.",
  skill: "insights",

  detailedDescription: `Analyzes local OpenCode session history (SQLite DB, read-only) and produces a structured insights report: what was worked on, how tools were used, where friction happened, and what to do next.

The analysis covers:
1. **Stats** — messages, files touched, active days, sessions per project.
2. **Project Areas** — clusters sessions into 3-5 main topics.
3. **Big Wins** — evidence-backed achievements (multi-file edits, long autonomous runs, completed orchestrations).
4. **Friction** — categorized failures: tool failures, API/network errors, ambiguous requests, retry loops, user rejections.
5. **Strategic Horizons** — data-grounded recommendations (skills to create, workflows to automate, rules to update).

Data is gathered via the session-memory skill's read-only SQLite queries (last 20 sessions or 2 weeks default; range or session ID override supported). The report is written to .opencode/state/insights/insights-{YYYYMMDD}.md.

Distinct from /maintain-hub retrospect (post-run lessons-learned for a single orchestration): this analyzes cross-session usage history. Use insights when the question is "what have I been working on / where am I losing time" — use retrospect when finishing a specific run.

Rules: read-only DB access (mode=ro), evidence over vibes (every claim traces to transcript text), synthesize don't dump.`,
  tools: TOOLS_LOADSKILL_BASH,
  relatedSkills: ["session-memory"],
  examples: [
    {
      input: "/project insights",
      approach: "Load the insights skill, gather session data via read-only SQLite queries (default last 20 sessions), cluster into project areas, count friction categories, write .opencode/state/insights/insights-{date}.md, summarize top findings."
    },
    {
      input: "/project insights --range 2weeks",
      approach: "Same analysis scoped to the last 2 weeks — stats, wins, friction categories, and horizon recommendations grounded in that window."
    }
  ],
  warnings: [
    "Read-only on the OpenCode DB — never modify it",
    "Avoid auth/provider tables (account, credential, control_account, account_state)",
    "Claims in the report must trace to transcript evidence, not vibes"
  ],
}

export default spec
