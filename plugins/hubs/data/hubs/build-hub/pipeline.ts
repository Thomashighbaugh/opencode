import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "pipeline",
  description: "Declarative stages: lint → test → build → deploy, each gating the next",
  reminder: "Multi-stage pipeline with hard gates. Asks: stages + deploy command.",
  inline: true,

  detailedDescription: `Declarative multi-stage pipeline with hard gates between stages. Each stage runs to completion; if it fails, downstream stages do NOT run. The pipeline halts on first failure.

Default stages (configurable):
1. Lint — static analysis, style checks. Gate: zero errors.
2. Test — unit + integration tests. Gate: all pass.
3. Build — compile/bundle for production. Gate: succeeds without errors.
4. Deploy — ship the artifact. Gate: deployment confirms success.

Define custom stages via a pipeline spec file or flags. Each stage can be an agent invocation, a shell command, or a skill. The orchestrator runs stages sequentially and reports the gate result for each.

Use for CI/CD-like workflows where you want the agent to drive the release process end-to-end with quality gates. NOT for development tasks — this is a delivery pipeline, not a coding pattern.

## Gatekeeping Question

Before running, ask (passing the flags skips the question — non-interactive path):

> **Question 1 — which stages?** (multi-select; default: lint, test, build, deploy)
> 1. lint
> 2. test
> 3. build
> 4. deploy
> (select any combination, or type your own comma-separated list)
>
> **Question 2 — deploy command?** (only when "deploy" is selected)
> 1. Pick a package.json script (e.g. "npm run deploy:prod")
> 2. Type your own

Resolved answers map to \`--stages='...'\` and \`--deploy-cmd="..."\`.`,

  tools: ["bash", "modeState", "loadSkill"],
  relatedSkills: [],

  examples: [
    {
      input: "/build-hub pipeline",
      approach: "Asks stages (lint,test,build,deploy) and deploy command (npm run deploy:prod). Run lint → pass → run test → pass → run build → pass → run deploy:prod. If any stage fails, stop and report which gate failed."
    }
  ]
}

export default spec
