import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_BASH_LISTAGENTS } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "adversarial-debate",
  description: "Spec validation via oppositional debate — proposer vs critics",
  reminder: "Validate specs via adversarial debate. Asks: topic or spec.",
  inline: true,

  detailedDescription: `Spec validation through structured adversarial debate:

1. Proposer: presents the spec/design and argues it's sound.
2. Security critic: argues the spec has security flaws (attack surface, auth gaps, injection, data exposure).
3. Performance critic: argues the spec has performance flaws (N+1 queries, unbounded queries, missing indexes, scaling cliffs).
4. Judge: weighs the arguments and produces a verdict — the spec passes, passes with conditions, or fails with specific issues to fix.

The debate is structured, not free-form. Each role has a mandate to find flaws in their domain. The judge prevents the proposer from dismissing valid criticisms.

Use for high-stakes specs where a single perspective might miss critical flaws. The adversarial structure forces thorough examination.

## Gatekeeping Question

Before debating, ask (passing the flag skips the question — non-interactive path):

> **Question — what to debate?**
> 1. Type a topic/claim inline (e.g. "our token rotation is secure")
> 2. Select an existing spec/design file (list *.md specs/designs)
> (or type a path)

Resolved answer is either the inline topic or \`--spec=<file>\`.`,

  tools: TOOLS_BASH_LISTAGENTS,
  relatedSkills: [],

  examples: [
    {
      input: "/ideate-hub adversarial-debate",
      approach: "Asks what to debate — user types the claim 'rotation doesn't prevent replay within the token lifetime'. Proposer argues it's sound. Security critic and Performance critic attack it. Judge: 'fail — fix replay prevention and add token cache'."
    },
    {
      input: "/ideate-hub adversarial-debate --spec=auth-redesign.md",
      approach: "Flag passed → gate skipped. Same debate, run against the named spec file."
    }
  ]
}

export default spec
