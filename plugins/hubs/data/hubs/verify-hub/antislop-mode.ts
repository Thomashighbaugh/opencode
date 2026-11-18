import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "antislop-mode",
  description: "During/After/ask mode resolver for antislop rules",
  reminder: "Resolves antislop usage mode: explicit session choice > saved preference > ask. Announces the active mode and source once.",
  inline: true,

  detailedDescription: `Anti-slop usage-mode resolver. Implements anti-slop's strict mode order on first antislop activation in each session:

## Mode resolution order (strict)

1. **Explicit session instruction**: the user explicitly selects "during" or "after" in this conversation. Announces "antislop active: <mode> (session override.)". Overrides saved preference. Does not change the saved preference.
2. **Global preference**: read from .opencode/state/verify-hub/antislop-mode.json (mode field: during/after/ask). Announces "antislop active: <mode> (global preference.)". Continues without asking.
3. **Ask if unresolved**: no settings file, missing mode field, or saved mode is "ask". Asks "When do you want to use antislop? 1. DURING ... 2. AFTER ..." and ends the response, waiting for the answer before any UI review, planning, or concept.

## Notice placement

- Read-only tasks: notice at the start of the final answer, before findings/concept. Never in progress messages.
- Editing tasks: announce before the first edit; omit from the final answer.
- Additional antislop skills reuse the resolved mode without another question or notice. Announce again only if the mode changes.

## State

Mode preference persisted to .opencode/state/verify-hub/antislop-mode.json as {"mode": "during|after|ask", "source": "session|global"}.

## When to use

To set or check the antislop mode for the current session or as a saved default. Runs automatically before antislop-gate and antislop-audit; rarely needs to be invoked directly.

## Examples

| Input | Approach |
|-------|----------|
| /verify-hub antislop-mode --set during | Saves mode=during to state, announces source. |
| /verify-hub antislop-mode --set after | Saves mode=after to state. |
| /verify-hub antislop-mode --set ask | Restores per-session questioning. |
| /verify-hub antislop-mode --show | Prints current mode and source without changing it. |
`,
  tools: ["modeState", "bash", "agentContext"],
  rules: ["context-strategy", "anti-refusal"],
  relatedSkills: ["antislop-ui", "antislop-copywriting", "antislop-human", "antislop-layoutmobile", "antislop-code"],
  warnings: [
    "Explicit session choice always wins over saved preference — never let the settings file replace a mode the user selected in this conversation.",
    "When unresolved, end the response after asking; do not start UI work until the user answers.",
  ]
}

export default spec
