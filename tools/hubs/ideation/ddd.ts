import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "ddd",
  description: "Domain-driven design — model bounded contexts, aggregates, domain events",
  reminder: "Model bounded contexts and domain events.",
  inline: true,

  detailedDescription: `Domain-Driven Design modeling: identifies bounded contexts, aggregates, entities, value objects, domain events, and the relationships between them.

Process:
1. Identify the domain and subdomains (core, supporting, generic).
2. Define bounded contexts — boundaries where a model is consistent.
3. Within each context: identify aggregates (consistency boundaries), entities (with identity), value objects (without identity), and domain events.
4. Map context relationships (context map): shared kernels, customer-supplier, conformist, anti-corruption layers.
5. Identify ubiquitous language — terms that are precise within each context.

Output: a DDD model document with context map diagram, aggregate definitions, and event definitions. This becomes the architectural foundation for implementation.

Use for complex business domains where understanding the domain structure is essential to good architecture. Overkill for simple CRUD apps.`,

  tools: ["bash"],
  relatedSkills: ["graph-thinking"],
}

export default spec