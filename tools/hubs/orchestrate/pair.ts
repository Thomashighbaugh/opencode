import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "pair",
  description: "Pair programming — two agents on one task: Driver writes code, Navigator reviews in real-time, catching mistakes early",
  reminder: "Driver/Navigator pair programming.",
  inline: true,

  detailedDescription: `Two-agent pair programming on a single task:

- Driver: writes the implementation code. Has edit access. Focused on getting it working.
- Navigator: reviews the Driver's output in real-time. Does NOT write code. Catches bugs, suggests alternatives, flags edge cases, enforces conventions. Has read-only access + a message channel to the Driver.

The Navigator reviews after each meaningful chunk (function, file section) — not at the end. This catches mistakes early when they're cheap to fix, rather than at a final review where rework is expensive.

Use for complex or error-prone code where a second perspective during writing (not after) prevents defects: security-sensitive code, algorithm implementation, concurrent code, tricky refactors. NOT for boilerplate or trivial changes — that's a waste of the Navigator.

Configure roles via flags: --driver=@executor, --navigator=@code-reviewer (defaults).`,

  tools: ["listAgents", "modeState", "bash"],
  relatedSkills: [],

  examples: [
    {
      input: "/orchestrate pair --navigator=@security-reviewer 'implement the password reset token flow'",
      approach: "Driver writes the token generation, Navigator immediately flags 'token must be cryptographically random, not Math.random()'. Driver fixes. Driver writes the email step, Navigator flags 'don't log the token'. Driver fixes."
    }
  ]
}

export default spec