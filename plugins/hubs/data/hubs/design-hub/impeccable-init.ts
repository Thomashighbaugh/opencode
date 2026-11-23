import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "impeccable-init",
  description: "Capture product context in PRODUCT.md (impeccable init)",
  reminder: "Runs impeccable init to write PRODUCT.md.",
  inline: true,

  detailedDescription: `Runs \`impeccable init\` via the impeccable skill launcher to capture durable product context in PRODUCT.md. Reads existing project context, asks only what it can't infer, and writes PRODUCT.md. Every later impeccable command reads it. See reference/init.md in skills/impeccable/reference/.`,

  tools: ["read", "write", "bash", "agentContext"],
  rules: ["file-operations", "writing-style"],
  relatedSkills: ["impeccable"],
}

export default spec
