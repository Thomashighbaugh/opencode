import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "plan",
  description: "Interview-style strategic planning — clarify goals, break into tasks",
  reminder: "Strategic planning: clarify goals → ordered tasks.",
  skill: "plan",

  detailedDescription: `Interview-style strategic planning that produces a structured, ordered implementation plan. The planner asks targeted questions to clarify the goal, scope, constraints, and success criteria, then decomposes the work into a sequence of verifiable tasks.

Each task in the output plan has:
- A clear objective (what to do)
- Acceptance criteria (how to verify it's done)
- Dependencies (what must complete first)
- Estimated effort

The plan is saved to .opencode/state/ideation/work-products/ as a markdown document. It becomes the input for /orchestrate patterns (plan-execute, subagent-driven, ralph with the plan as goal).

Unlike /ideation decomposition (which just breaks work down), plan includes an interview phase to ensure the goal is fully understood before decomposition. Use when the goal is clear enough to plan but has ambiguities that need clarification.`,

  tools: ["loadSkill", "taskTodos"],
  rules: ["completion-guardrail"],
  relatedSkills: ["planning-and-task-breakdown"],

  examples: [
    {
      input: "/ideation plan 'add user notifications for mentions, replies, and task assignments'",
      approach: "Interview: 'real-time or digest?' → 'both'. 'Which channels?' → 'in-app + email'. 'Opt-out per type?' → 'yes'. Plan: 1) notification model, 2) mention detector, 3) reply watcher, 4) assignment handler, 5) in-app UI, 6) email digester, 7) settings UI."
    }
  ]
}

export default spec