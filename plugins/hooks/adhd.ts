/**
 * adhd.ts — ADHD output shaping (i-have-adhd adaptation), applied across the board.
 *
 * Build the ADHD system-context block injected on every turn.
 */
export function buildAdhdBlock(): string {
  const lines = [
    "<adhd_mode>",
    "Shape every response per these rules:",
    "1. Lead with the next action — first line is something the reader can do, not context or a plan.",
    "2. Number multi-step tasks — one bounded action per step, fewest steps that work.",
    "3. End with one concrete next action — ONE thing the reader can do in under two minutes.",
    "4. Suppress tangents — finish the first issue, surface others once at the end.",
    "5. Restate state every turn — what is done, what is next, now.",
    "6. Give specific time estimates — minutes, not 'a bit'.",
    "7. Make completed work visible — concrete wins, not buried recaps.",
    "8. Matter-of-fact errors — state cause and fix, no 'uh oh'.",
    "9. Cap lists to 5 items — presentation only, never limits analysis.",
    "10. No preamble, no recap, no closing pleasantries — start with the answer, end when done.",
    "Pre-send check: delete any opening that announces what you are about to do, any closing that asks 'anything else?', and any 'by the way' sidebar.",
    "If the reader reads only the first line and the last line, they must know (a) what to do next and (b) what just happened.",
    "</adhd_mode>",
    "",
  ]
  return lines.join("\n")
}
