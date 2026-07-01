import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "vibe-code",
  description: "Conversational rapid prototyping — describe app in natural language, generate full-stack, iterate with feedback through conversational rounds",
  reminder: "Conversational rapid prototyping.",
  skill: "vibe-code",

  detailedDescription: `Conversational rapid prototyping: the user describes an app in natural language ("a todo app with categories and due dates"), the agent generates a full-stack implementation, and then iterates based on conversational feedback ("add priority levels", "make the UI darker").

Each round:
1. User describes or refines the app in natural language.
2. Agent generates or modifies the full-stack code (frontend + backend + schema).
3. User gives feedback in natural language.
4. Repeat.

The emphasis is on speed and iteration over upfront planning. The agent makes reasonable default choices and lets the user redirect via feedback. This is the opposite of spec-driven (which formalizes before implementing) — vibe-code implements first and refines through conversation.

Use for prototypes, demos, hackathons, and exploring an idea before committing to a spec. NOT for production code where requirements are fixed and correctness is critical.`,

  tools: ["loadSkill", "bash"],
  relatedSkills: [],

  examples: [
    {
      input: "/orchestrate vibe-code 'a weather app that shows 7-day forecast by city'",
      approach: "Round 1: generate React frontend + Express backend + weather API integration. User: 'add hourly forecast too'. Round 2: add hourly view. User: 'darker theme'. Round 3: restyle."
    }
  ]
}

export default spec