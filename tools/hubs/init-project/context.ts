import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "context",
  description: "Capture session knowledge, promote insights to project memory and docs",
  reminder: "Capture session knowledge for project memory.",
  skill: "remember",
  phases: "5",

  detailedDescription: `Captures knowledge from the current session and promotes it to durable storage. Delegates to the remember skill which:

1. Reviews the session for decisions, patterns, lessons.
2. Classifies each item: project memory, notepad, wiki, decisions (ADRs), patterns.
3. Routes each to the appropriate durable location.
4. Strips sensitive data before committing.

Use as part of /init-project setup (phase 5) or standalone when you want to preserve session knowledge before it's lost.`,

  tools: ["loadSkill", "bash", "agentContext"],
  rules: ["context-strategy", "security"],
  relatedSkills: [],
}

export default spec