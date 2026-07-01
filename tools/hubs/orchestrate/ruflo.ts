import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "ruflo",
  description: "60+ agent swarm with Q-Learning smart routing, 4 consensus protocols, and Queen/Worker hierarchical topologies",
  reminder: "60+ agent swarm with Q-Learning.",
  inline: true,

  detailedDescription: `Large-scale swarm with 60+ agents, Q-Learning-based smart routing, four consensus protocols, and Queen/Worker hierarchical topologies:

- Q-Learning routing: a reinforcement learning layer routes tasks to the agent that has historically performed best on similar tasks. The Q-table is updated based on outcomes, so routing improves over time.
- 4 consensus protocols: majority, weighted, Byzantine (tolerates faulty agents), and synthesis. Chosen per task based on task characteristics.
- Queen/Worker topology: a Queen agent coordinates Worker agents. The Queen assigns tasks, monitors progress, and resolves conflicts. Workers execute. Alternative topologies (flat, hierarchical) are configurable.

This is the heaviest orchestration pattern. Use ONLY for very large tasks that genuinely need 60+ agents — most tasks don't. The Q-Learning overhead only pays off if the swarm runs enough tasks for learning to improve routing.`,

  tools: ["bash", "listAgents", "modeState", "taskTodos"],
  relatedSkills: [],

  warnings: [
    "60+ agents = extreme API request consumption. The Q-Learning routing only pays off after many invocations. Most tasks should use lighter patterns (team, swarm, ultrawork)."
  ]
}

export default spec