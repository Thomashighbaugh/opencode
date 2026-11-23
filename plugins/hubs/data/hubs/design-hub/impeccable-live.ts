import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "impeccable-live",
  description: "Browser variant mode (impeccable live)",
  reminder: "Runs impeccable live to iterate on UI variants in the browser.",
  inline: true,

  detailedDescription: `Runs \`impeccable live\` via the impeccable skill launcher to open the running dev server with an overlay. Select an element, pick a direction, and iterate variants in place. Works with Vite, Next, SvelteKit, Astro, Nuxt, and plain HTML. Only edits a local checkout — never inject into a deployed site or weaken a production CSP. See reference/live.md in skills/impeccable/reference/.`,

  tools: ["read", "bash", "agentContext"],
  rules: ["file-operations", "security"],
  relatedSkills: ["impeccable"],
}

export default spec
