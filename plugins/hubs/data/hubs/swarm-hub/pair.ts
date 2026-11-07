import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_LISTAGENTS_MODESTATE_BASH } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "pair",
  description: "Two agents on one task — a driver writes, a navigator reviews live",
  reminder: "Driver/Navigator pair programming. Asks: driver + navigator agents.",
  inline: true,

  detailedDescription: `Two-agent pair programming on a single task:

- Driver: writes the implementation code. Has edit access. Focused on getting it working.
- Navigator: reviews the Driver's output in real-time. Does NOT write code. Catches bugs, suggests alternatives, flags edge cases, enforces conventions. Has read-only access + a message channel to the Driver.

The Navigator reviews after each meaningful chunk (function, file section) — not at the end. This catches mistakes early when they're cheap to fix, rather than at a final review where rework is expensive.

Use for complex or error-prone code where a second perspective during writing (not after) prevents defects: security-sensitive code, algorithm implementation, concurrent code, tricky refactors. NOT for boilerplate or trivial changes — that's a waste of the Navigator.

## Gatekeeping Question

Before pairing, ask (passing the flags skips the question — non-interactive path):

> **Question 1 — driver agent?** (default @executor)
>
> **Question 2 — navigator agent?** (default @code-reviewer)
> 1. @code-reviewer — code quality
> 2. @security-reviewer — security-sensitive code
> 3. @qa-tester — functional verification
> (or type your own @agent)

Resolved answers map to \`--driver=@x\` and \`--navigator=@y\`.`,

  tools: TOOLS_LISTAGENTS_MODESTATE_BASH,
  relatedSkills: [],

  examples: [
    {
      input: "/swarm-hub pair 'implement the password reset token flow'",
      approach: "Asks driver (@executor) and navigator (@security-reviewer). Driver writes the token generation, Navigator immediately flags 'token must be cryptographically random, not Math.random()'. Driver fixes. Driver writes the email step, Navigator flags 'don't log the token'. Driver fixes."
    },
    {
      input: "/swarm-hub pair --navigator=@security-reviewer 'implement the password reset token flow'",
      approach: "Flag passed → navigator gate skipped (driver still defaults to @executor). Same review flow."
    }
  ]
}

export default spec
