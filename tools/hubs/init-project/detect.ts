import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "detect",
  description: "Deep stack detection — analyze codebase for languages, frameworks, build tools, testing, ORM, CSS, CI/CD, etc. via @stack-detector agent",
  reminder: "Detect full tech stack via @stack-detector agent.",
  agent: "stack-detector",
  phases: "0-1",

  detailedDescription: `Deep stack detection via the @stack-detector agent. Analyzes the codebase to produce a structured stack fingerprint:

- Languages (primary + secondary)
- Frameworks (web, API, testing)
- Build tools (bundler, compiler, task runner)
- Testing framework (unit, integration, e2e)
- ORM/database layer
- CSS approach (Tailwind, CSS modules, styled, etc.)
- CI/CD (GitHub Actions, Jenkins, etc.)
- Package manager
- Linting/formatting

The fingerprint is saved as JSON to .opencode/state/init/stack-fingerprint.json. It's the input for /init-project recommend and /init-project provision.

Use standalone when you want to know what the project uses without running the full setup.`,

  tools: ["listAgents", "bash"],
  relatedSkills: [],
}

export default spec