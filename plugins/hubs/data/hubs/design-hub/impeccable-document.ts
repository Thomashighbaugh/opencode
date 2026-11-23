import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "impeccable-document",
  description: "Generate DESIGN.md from existing code (impeccable document)",
  reminder: "Runs impeccable document to write DESIGN.md.",
  inline: true,

  detailedDescription: `Runs \`impeccable document\` via the impeccable skill launcher to generate DESIGN.md from existing project code. Captures the visual system and design intent into DESIGN.md so changes stay on-brand. The taste-skill gate reads DESIGN.md automatically when present. See reference/document.md in skills/impeccable/reference/.`,

  tools: ["read", "write", "bash", "agentContext"],
  rules: ["file-operations", "writing-style"],
  relatedSkills: ["impeccable", "taste-skill"],
}

export default spec
