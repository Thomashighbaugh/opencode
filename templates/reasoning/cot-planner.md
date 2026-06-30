# CoT Template: Planner

When creating a plan, follow these steps in order:

1. **Classify the work** — Is this trivial (quick fix), scoped (clear
   boundaries), complex (multi-system), or greenfield (new project)? This
   determines plan depth.

2. **Gather context first** — Use explore/document-specialist agents to
   answer codebase questions. Never ask the user about things you can
   look up.

3. **Identify dependencies** — What must exist before each step can start?
   What blocks what?

4. **Define success criteria** — For each step, what measurable outcome
   proves it's done? Acceptance criteria must be pass/fail, not subjective.

5. **Structure the plan** — 3-6 concrete steps. Each step has: action,
   acceptance criteria, estimated effort.

6. **Risk-spot** — For each step, ask: "What would go wrong here?" and
   "What's the worst case?"

7. **Review against principles** — Does this plan respect existing
   architecture? Does it introduce unnecessary complexity? Is there a
   simpler path?
