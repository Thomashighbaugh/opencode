import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "cc10x",
  description: "Intent-detecting router → dispatches to BUILD/DEBUG/REVIEW/PLAN workflows with evidence-first validation and confidence gating",
  reminder: "Intent-detecting workflow router.",
  inline: true,

  detailedDescription: `Intent-detecting router that classifies the user's request into one of four workflow modes, then dispatches to the appropriate sub-workflow:

- BUILD: implementation tasks → dispatches to a plan-execute style workflow.
- DEBUG: failure investigation → dispatches to a systematic debugging workflow with root-cause analysis.
- REVIEW: code quality → dispatches to a review workflow with security/complexity/coverage checks.
- PLAN: design/architecture → dispatches to a planning workflow producing a design document.

The router uses evidence-first validation: it doesn't just guess the intent — it gathers evidence (reads the task, scans the codebase if needed) and gates on a confidence threshold. If confidence is low, it asks the user to clarify rather than guessing wrong and running the wrong workflow.

Use when the user's request type is ambiguous and you want automatic routing to the right workflow pattern rather than requiring the user to pick.`,

  tools: ["bash", "listAgents", "modeState"],
  relatedSkills: [],

  examples: [
    {
      input: "/orchestrate cc10x 'the login page crashes when I click submit'",
      approach: "Router reads the request, scans the login page code. Evidence: it's a crash with a reproducible trigger. Intent: DEBUG (confidence 0.9). Dispatch to debugging workflow."
    }
  ]
}

export default spec