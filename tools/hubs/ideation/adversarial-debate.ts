import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "adversarial-debate",
  description: "Spec validation via oppositional debate — proposer vs security/performance critics with judge convergence",
  reminder: "Validate specs via adversarial debate.",
  inline: true,

  detailedDescription: `Spec validation through structured adversarial debate:

1. Proposer: presents the spec/design and argues it's sound.
2. Security critic: argues the spec has security flaws (attack surface, auth gaps, injection, data exposure).
3. Performance critic: argues the spec has performance flaws (N+1 queries, unbounded queries, missing indexes, scaling cliffs).
4. Judge: weighs the arguments and produces a verdict — the spec passes, passes with conditions, or fails with specific issues to fix.

The debate is structured, not free-form. Each role has a mandate to find flaws in their domain. The judge prevents the proposer from dismissing valid criticisms.

Use for high-stakes specs where a single perspective might miss critical flaws. The adversarial structure forces thorough examination.`,

  tools: ["bash", "listAgents"],
  relatedSkills: [],

  examples: [
    {
      input: "/ideation adversarial-debate --spec=auth-redesign.md",
      approach: "Proposer: 'token rotation is secure'. Security critic: 'rotation doesn't prevent replay within the token lifetime'. Performance critic: 'DB lookup per request is O(n)'. Judge: 'fail — fix replay prevention and add token cache'."
    }
  ]
}

export default spec