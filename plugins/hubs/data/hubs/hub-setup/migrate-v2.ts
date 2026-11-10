import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_BASH, SKILLS_HUBS_DOCTOR, SKILLS_SDK_DEV } from "../shared-spec-fragments"
const spec: HubSubcommandSpec = {
  label: "migrate-v2",
  description: "Rewrite a project's V1 tools and config for OpenCode 2",
  reminder: "Migrate this project to OpenCode 2 — V1 tools become V2 tool plugins.",
  skill: "hubs-setup",
  phases: "0-8",

  detailedDescription: `Migrates a user project from OpenCode 1 conventions to OpenCode 2. Run it against the project root, not against the global config — the global config in this repo is already dual-compatible.

## What actually breaks

OpenCode 2's config normalizer migrates most V1 keys on its own: \`provider\` → \`providers\`, the \`permission\` map → \`permissions[]\`, the \`mcp\` map → \`mcp.servers\`, the \`skills\` object → \`string[]\`. Two things it cannot fix:

1. **File-based tool discovery is gone.** A file at \`.opencode/tools/foo.ts\` is inert — nothing scans the directory. A tool exists only when a plugin registers it through \`ctx.tool.transform((editor) => editor.add({ ... }))\`. Every V1 tool silently stops working.
2. **A config plugin entry that points at a FILE is rejected.** V2 logs "configured plugin path must be a directory" and drops it. Only plugin directories (or auto-discovered files under \`plugins/\`) load.

## The script

\`\`\`bash
bun ~/.config/opencode/skills/hubs-setup/scripts/migrate-v2.ts --project <dir>
\`\`\`

| Flag | Effect |
|------|--------|
| \`--project <dir>\` | Project root (default: cwd). The script walks up for \`.git\` or \`.opencode\`. |
| \`--dry-run\` | Report every change, write nothing. |
| \`--v2-native\` | Also rewrite the config keys to the native V2 shape (see below). |
| \`--force\` | Overwrite an existing plugin directory with the same name. |
| \`--json\` | Machine-readable report. |

### What it does

- **Tools**: reads every \`.opencode/tools/*.ts\` and \`.opencode/tool/*.ts\`, extracts the \`name\`, \`description\`, \`args\` schema and the \`execute\` body, and writes \`.opencode/plugins/<name>/index.ts\` — a V2 tool plugin that registers through \`ctx.tool.transform\`. The original file is removed (it is tracked by git, so the move is recoverable).
  - A JSON Schema \`args\` block is carried over as-is.
  - A zod \`args\` schema is converted at registration time with \`z.toJSONSchema(schema, { io: "input", unrepresentable: "any" })\` from \`zod/v4\` (needs zod >= 3.25).
  - The V1 result contract (a bare string or an object) is adapted to V2's \`{ content }\`.
  - \`context.directory\` is injected into the tool context, because the V2 tool context carries no filesystem path.
- **Plugin entries**: a config entry that points at a file is removed. If the file is already a V2 plugin (\`export default { id, setup }\`), it is copied into \`.opencode/plugins/<name>/index.ts\` and stays auto-discovered.
- **Config (only with \`--v2-native\`)**: the \`permission\` map becomes a \`permissions[]\` array (\`bash\` → \`shell\`, \`task\` → \`subagent\`, \`write\`/\`patch\` → \`edit\`), the \`mcp\` map becomes \`mcp.servers\` (\`enabled\` → inverted \`disabled\`, a local server gets an explicit \`"type": "local"\`), and \`skills\` becomes a flat array of paths and URLs. Comments and formatting outside the rewritten values are preserved.

### What it does not do

- **It does not port V1 plugin bodies.** A V1 hook plugin (\`export default { hooks: { ... } }\`) needs a manual rewrite: V2 has no hook map — each hook has its own domain (\`ctx.event.subscribe\`, \`ctx.tool.hook\`, \`ctx.session.hook\`, \`ctx.permission.hook\`). The mapping table lives in \`plugins/hooks/index.ts\` in the global config. The script reports these files instead of touching them.
- **It does not rewrite \`provider\` into \`providers\`.** V2's normalizer does that correctly, including the per-model metadata. Hand-rolling it would lose model capabilities.
- **It does not touch the global config.** This repo's global config is deliberately V1-shaped so both binaries start.

## V2-native vs dual-compatible

Without \`--v2-native\` the config keeps its V1 keys, which V2 migrates automatically — and OpenCode 1 still starts on it. With \`--v2-native\` the config is written in the native V2 shape, which is cleaner to read but **makes the project V2-only**: OpenCode 1 refuses to start on a config with a \`permissions[]\` array ("V2 permissions are not supported by OpenCode V1").

## After the migration

1. \`opencode2 plugin list\` — the new tool plugins must appear.
2. \`opencode2 debug config\` — the project config must load with no errors.
3. Run one tool through the model (\`opencode2 run --standalone --model <provider/model> "call the <tool>"\`) — registration errors only surface at call time.
4. Review every "Needs manual work" entry in the report.
5. Commit the move: \`git add -A && git commit -m "migrate to OpenCode 2 tool plugins"\`.`,

  tools: TOOLS_BASH,
  relatedSkills: [...(SKILLS_HUBS_DOCTOR ?? []), ...(SKILLS_SDK_DEV ?? [])],

  examples: [
    {
      input: "/hub-setup migrate-v2",
      approach:
        "Run the script with --dry-run first and show the report. Then run it for real, and report each migrated tool with its old and new path. Flag the V1 plugin file as manual work and point at the V1 → V2 hook mapping in plugins/hooks/index.ts.",
    },
    {
      input: "/hub-setup migrate-v2 --project ~/code/my-app",
      approach:
        "Migrate a specific project. The script resolves the project root, rewrites .opencode/tools/*.ts into .opencode/plugins/<name>/index.ts, removes file-style plugin entries from the config, and prints the list of files that still need a manual port.",
    },
    {
      input: "/hub-setup migrate-v2 --v2-native",
      approach:
        "Migrate and rewrite the config to the native V2 shape: permissions[] array, mcp.servers, skills as a string[]. Warn that this makes the project V2-only — OpenCode 1 will no longer start on it.",
    },
  ],

  warnings: [
    "A V1 tool file is deleted after it is rewritten. The move is recoverable through git, but commit the result before doing anything else.",
    "A zod-based `args` schema is converted with `z.toJSONSchema` from `zod/v4`; the project needs zod >= 3.25 for that to resolve.",
    "`--v2-native` rewrites the permission map into the V2 `permissions[]` array. OpenCode 1 refuses to start on that shape — it is a one-way door for that project.",
    "A V1 hook plugin is reported, not rewritten. V2 dropped the hook map: each hook moved to its own domain (`ctx.event.subscribe`, `ctx.tool.hook`, `ctx.session.hook`, `ctx.permission.hook`).",
  ],
}

export default spec
