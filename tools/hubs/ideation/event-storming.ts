import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "event-storming",
  description: "Collaborative domain exploration via timeline, commands, events, policies",
  reminder: "Explore domain via event timeline.",
  inline: true,

  detailedDescription: `Event storming: explores a domain by modeling it as a timeline of domain events. The process:

1. Enumerate domain events (past-tense facts: "order placed", "payment processed").
2. Arrange events along a timeline (left to right = time).
3. Identify commands that trigger events ("place order" → "order placed").
4. Identify policies (reactions to events: "when order placed, then send confirmation" → "send confirmation" command).
5. Identify aggregates (clusters of events/commands that belong together).
6. Identify bounded contexts (groups of related aggregates).

The timeline reveals the domain's behavior, not just its structure. Policies (event → command chains) expose automation opportunities and hidden requirements.

Output: an event storm diagram (timeline + commands + policies + aggregates) saved as markdown/Mermaid. Use for complex domains where behavior (not just structure) needs modeling.`,

  tools: ["bash"],
  relatedSkills: ["graph-thinking"],
}

export default spec