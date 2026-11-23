import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "impeccable-overdrive",
  description: "Shaders, effects, scroll scenes (impeccable overdrive)",
  reminder: "Runs impeccable overdrive against the target.",
  inline: true,

  detailedDescription: `Runs \`impeccable overdrive <target>\` via the impeccable skill launcher to push past conventional limits with shaders, spring physics, and scroll-driven effects. Only appropriate for tech/gaming/software surfaces — never for cafes, bakeries, guesthouses, or shops (those get photographs per antislop rule). Pass a target path as the argument. See reference/overdrive.md in skills/impeccable/reference/.`,

  tools: ["read", "bash", "agentContext"],
  rules: ["antislop", "antislop-liveliness", "file-operations"],
  relatedSkills: ["impeccable", "taste-skill"],
}

export default spec
