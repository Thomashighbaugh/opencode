import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_LOADSKILL_BASH } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "config",
  description: "Create or modify opencode.jsonc with mandatory schema validation — wraps opencode-configure, opencode-config-workflow; always fetches and validates final output against https://opencode.ai/config.json",
  reminder: "Create/modify opencode.jsonc with mandatory schema validation.",
  skill: "opencode-configure",

  detailedDescription: `Creates or modifies opencode.jsonc (or .opencode/opencode.jsonc for project scope) with mandatory schema validation against the canonical OpenCode schema.

## Workflow

1. **Load config skills** — loads \`opencode-configure\` and \`opencode-config-workflow\` for comprehensive config surface knowledge.

2. **Elicit intent** — if the user hasn't specified exact changes, interview them to determine: scope (global vs project), what to change (model, provider, MCP, plugins, permissions, instructions, tools, etc.), and target values.

3. **Apply changes** — edit the target config file using the loaded skills' guidance. Allowed keys per the schema: \`$schema\`, \`shell\`, \`logLevel\`, \`server\`, \`command\`, \`skills\`, \`references\`, \`watcher\`, \`snapshot\`, \`plugin\`, \`share\`, \`autoupdate\`, \`disabled_providers\`, \`enabled_providers\`, \`model\`, \`small_model\`, \`default_agent\`, \`username\`, \`agent\`, \`provider\`, \`mcp\`, \`formatter\`, \`lsp\`, \`instructions\`, \`permission\`, \`tools\`, \`attachment\`, \`enterprise\`, \`tool_output\`, \`compaction\`, \`experimental\`.

4. **Fetch schema** — fetch \`https://opencode.ai/config.json\` and validate the final config against it.

5. **Validate** — check for:
   - Invalid keys (anything not in the allowed list above)
   - Type mismatches (e.g. \`model\` should be string, not object)
   - Missing required fields
   - Broken plugin paths, MCP URL format, provider model references

6. **Fix and re-validate** — if validation fails, fix the issues and re-validate. Loop until clean.

7. **Report** — output a validation report showing which checks passed, what was fixed (if anything), and the final config diff.

## MANDATORY

**This subcommand MUST ALWAYS validate the final output against \`https://opencode.ai/config.json\` before reporting completion.** Do not skip this step even if the change seems trivial. Schema violations cause runtime errors that are hard to debug.`,

  tools: TOOLS_LOADSKILL_BASH,
  relatedSkills: ["opencode-config-workflow"],
  warnings: [
    "Schema validation requires network access to https://opencode.ai/config.json — if offline, use cached schema from last fetch.",
    "Fetches the full config.json schema (~50KB) — avoid unnecessary repeated fetches within a session.",
    "Only modify one scope at a time (global or project). Mixed-scope edits in a single invocation risk cross-contamination."
  ]
}

export default spec
