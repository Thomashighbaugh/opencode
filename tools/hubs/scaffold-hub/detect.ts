import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_LISTAGENTS_BASH } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "detect",
  description: "Deep stack detection — languages, frameworks, tools, testing, CI",
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

The fingerprint is saved as JSON to .opencode/state/init/stack-fingerprint.json. It's the input for /scaffold-hub recommend and /scaffold-hub provision.

Use standalone when you want to know what the project uses without running the full setup.`,

  tools: TOOLS_LISTAGENTS_BASH,
  relatedSkills: [],
}

export default spec