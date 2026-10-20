/**
 * hubScaffold — add a new subcommand to an existing hub in one call.
 *
 * Adding a subcommand today costs ~6 steps: write the spec file, register it
 * in the hub's index.ts, run build-spec-registry, run gen-routing-docs,
 * check whether the TUI menu needs rebuilding. This tool does all of it:
 * writes the spec file, updates the hub's index.ts import+array, runs the
 * registry rebuild, and reports whether a TUI menu rebuild is needed.
 *
 * The TUI bundle rebuild itself is a shell command (bun run generate-menus +
 * bun build) — hubScaffold reports the command to run rather than shelling
 * out, so the caller controls when to run it.
 */

import { tool } from "@opencode-ai/plugin"
import * as fs from "fs"
import * as path from "path"
import { homedir } from "os"
import { execSync } from "child_process"

const USER_CONFIG_DIR = process.env.OPENCODE_CONFIG_DIR || path.join(homedir(), ".config", "opencode")
const HUBS_DIR = path.join(USER_CONFIG_DIR, "tools", "hubs")

/** Convert kebab-case label to camelCase identifier. */
function toCamel(label: string): string {
  return label.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
}

/** Convert kebab-case label to PascalCase identifier. */
function toPascal(label: string): string {
  return label
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("")
}

const SPEC_TEMPLATE = (label: string, description: string, hubName: string) => `import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "${label}",
  description: "${description}",
  reminder: "${description}",
  inline: true,

  detailedDescription: \`${description}\`,

  tools: ["bash"],
}

export default spec
`

export default tool({
  description:
    "Add a new subcommand to an existing hub: writes the spec file, registers it in the hub's index.ts, rebuilds the spec registry, and reports whether the TUI menu needs rebuilding. Use instead of doing these steps manually.",
  args: {
    hub: tool.schema.string().describe("Hub name, e.g. 'hub-setup', 'verify-hub'"),
    label: tool.schema.string().describe("Subcommand label in kebab-case, e.g. 'scaffold', 'map-codebase'"),
    description: tool.schema.string().describe("One-line description for the subcommand (max ~80 chars)"),
    dryRun: tool.schema.boolean().optional().describe("Preview changes without writing (default false)"),
  },
  async execute(args, _context) {
    const { hub, label, description } = args
    const hubDir = path.join(HUBS_DIR, hub)
    const specFile = path.join(hubDir, `${label}.ts`)
    const indexFile = path.join(hubDir, "index.ts")

    // Validate hub exists
    if (!fs.existsSync(hubDir)) {
      const available = fs.existsSync(HUBS_DIR) ? fs.readdirSync(HUBS_DIR).filter((d) => fs.statSync(path.join(HUBS_DIR, d)).isDirectory()) : []
      return JSON.stringify({ error: `Hub '${hub}' not found`, available }, null, 2)
    }
    if (!fs.existsSync(indexFile)) {
      return JSON.stringify({ error: `No index.ts in ${hubDir}` }, null, 2)
    }
    if (fs.existsSync(specFile)) {
      return JSON.stringify({ error: `Spec already exists: ${specFile}` }, null, 2)
    }

    const camelName = toCamel(label)
    const pascalName = toPascal(label)

    // Read existing index.ts
    const indexRaw = fs.readFileSync(indexFile, "utf-8")

    // Build new import line
    const newImport = `import ${camelName} from "./${label}"`

    // Insert import after last existing import
    const importLines = indexRaw.match(/^import .* from "\.\/.*"$/gm) ?? []
    if (!importLines.length) {
      return JSON.stringify({ error: "Could not parse imports in index.ts" }, null, 2)
    }
    const lastImport = importLines[importLines.length - 1]

    // Find the specs array and insert
    const specsArrayMatch = indexRaw.match(/export const specs = \[([\s\S]*?)\]/)
    if (!specsArrayMatch) {
      return JSON.stringify({ error: "Could not find 'export const specs = [' in index.ts" }, null, 2)
    }

    const existingSpecs = specsArrayMatch[1].trim().replace(/,$/, "")
    const newSpecsBody = existingSpecs ? `${existingSpecs},\n  ${camelName}` : `\n  ${camelName}\n`

    const newIndexRaw = indexRaw
      .replace(lastImport, `${lastImport}\n${newImport}`)
      .replace(specsArrayMatch[0], `export const specs = [${newSpecsBody}]`)

    const newSpecContent = SPEC_TEMPLATE(label, description, hub)

    if (args.dryRun) {
      return JSON.stringify(
        {
          dryRun: true,
          wouldWrite: specFile,
          wouldUpdate: indexFile,
          newImport,
          specPreview: newSpecContent.slice(0, 300) + "…",
        },
        null,
        2
      )
    }

    // Write spec file
    fs.writeFileSync(specFile, newSpecContent, "utf-8")

    // Write updated index.ts
    fs.writeFileSync(indexFile, newIndexRaw, "utf-8")

    // Rebuild spec registry
    let registryOutput = "(skipped)"
    try {
      registryOutput = execSync("npx tsx tools/build-spec-registry.ts", {
        cwd: USER_CONFIG_DIR,
        encoding: "utf-8",
        timeout: 30_000,
      }).trim()
    } catch (e) {
      registryOutput = `failed: ${String(e)}`
    }

    return JSON.stringify(
      {
        written: specFile,
        updated: indexFile,
        registry: registryOutput,
        tuiRebuild: {
          needed: true,
          command: "cd plugins/hubs-tui && bun run generate-menus && bun build src/tui.tsx --outdir dist --target bun --minify",
          verify: `grep '"label": "${label}"' plugins/hubs-tui/src/generated-hubs.ts`,
        },
      },
      null,
      2
    )
  },
})
