import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "scaffold",
  description: "Add a new hub subcommand — writes spec, updates index, rebuilds registry",
  reminder: "Scaffold a new subcommand for an existing hub.",
  inline: true,

  detailedDescription: `Adds a new subcommand to an existing hub in one step. Delegates to the hubScaffold tool, which:

1. Validates the hub exists and the label is not already taken.
2. Writes a new spec file at tools/hubs/<hub>/<label>.ts with a valid HubSubcommandSpec stub (label, description, reminder, inline, detailedDescription, tools).
3. Registers the subcommand in tools/hubs/<hub>/index.ts (adds the import and appends to the specs array).
4. Runs npx tsx tools/build-spec-registry.ts to regenerate the spec registry.
5. Reports whether the TUI menu needs rebuilding (rules/hub-menu-rebuild.md) and gives the exact command to run.

After scaffolding, edit the generated spec file to add a real detailedDescription, delegation target (skill/agent/command), tools, and rules. The stub is inline:true by default — change to skill:'name' or agent:'@name' if delegating.

Example: /hub-setup scaffold --hub verify-hub --label my-check --description "Run my custom verification"`,

  tools: ["hubScaffold", "bash"],
  rules: ["hub-menu-rebuild"],

  examples: [
    {
      input: "/hub-setup scaffold --hub verify-hub --label lint-check --description 'Run lint checks across changed files'",
      approach: "Scaffold the spec stub, register it, rebuild the registry, then edit the spec to add delegation",
    },
  ],

  warnings: ["After scaffolding, run the TUI menu rebuild command before the subcommand appears in the TUI dialog"],
}

export default spec
