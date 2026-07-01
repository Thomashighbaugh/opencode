import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "pipeline",
  description: "Declarative multi-stage pipeline — Stage 1: lint → Stage 2: test → Stage 3: build → Stage 4: deploy, each stage gates the next",
  reminder: "Multi-stage pipeline with hard gates.",
  inline: true,

  detailedDescription: `Declarative multi-stage pipeline with hard gates between stages. Each stage runs to completion; if it fails, downstream stages do NOT run. The pipeline halts on first failure.

Default stages (configurable):
1. Lint — static analysis, style checks. Gate: zero errors.
2. Test — unit + integration tests. Gate: all pass.
3. Build — compile/bundle for production. Gate: succeeds without errors.
4. Deploy — ship the artifact. Gate: deployment confirms success.

Define custom stages via a pipeline spec file or flags. Each stage can be an agent invocation, a shell command, or a skill. The orchestrator runs stages sequentially and reports the gate result for each.

Use for CI/CD-like workflows where you want the agent to drive the release process end-to-end with quality gates. NOT for development tasks — this is a delivery pipeline, not a coding pattern.`,

  tools: ["bash", "modeState", "loadSkill"],
  relatedSkills: [],

  examples: [
    {
      input: "/orchestrate pipeline --stages='lint,test,build,deploy' --deploy-cmd='npm run deploy:prod'",
      approach: "Run lint → pass → run test → pass → run build → pass → run deploy:prod. If any stage fails, stop and report which gate failed."
    }
  ]
}

export default spec