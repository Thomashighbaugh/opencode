import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "setup",
  description: "Full project setup — global Hubs verify, detection, scaffold, provision agents/tools, docs, context, routing, verify",
  reminder: "Full project init: verify, detect, scaffold, docs, validate.",
  skill: "init-project",
  phases: "0-8",

  detailedDescription: `Full 8-phase project initialization. Runs the complete setup pipeline:

Phase 0: Verify Hubs installation (run doctor).
Phase 1: Deep stack detection via @stack-detector.
Phase 2: Recommend global resources matching the detected stack.
Phase 3: Provision project-specific agents, skills, tools, rules into .opencode/.
Phase 4: Generate hierarchical AGENTS.md documentation.
Phase 5: Capture session knowledge and promote to context.
Phase 6: Configure hub routing.
Phase 7: Verify configuration completeness and reference integrity.
Phase 8: Final report.

Each phase writes a checkpoint to .opencode/state/init/ so setup can resume from where it left off if interrupted. Use at the start of a new project (or when taking over an existing one) to get the full Hubs treatment.`,

  tools: ["loadSkill", "listAgents", "bash", "modeState"],
  relatedSkills: ["stack-recommender", "provision", "deepinit", "hubs-doctor"],

  examples: [
    {
      input: "/init-project setup",
      approach: "Phase 0: doctor passes. Phase 1: detect TypeScript + React + Vite + Vitest + Prisma. Phase 2: recommend skills. Phase 3: provision .opencode/. Phase 4: generate AGENTS.md. Phase 5: capture. Phase 6: routing. Phase 7: verify. Phase 8: report."
    }
  ]
}

export default spec