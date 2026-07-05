/**
 * Build Script: Pre-compile hub subcommand specs into a single JSON registry.
 *
 * Scans all tools/hubs/<hub>/<subcommand>.ts files, extracts the
 * HubSubcommandSpec fields, and writes a single JSON file at
 * tools/hubs/spec-registry.json.
 *
 * Usage: npx tsx tools/build-spec-registry.ts
 *        npx tsx tools/build-spec-registry.ts --watch
 *
 * The registry is a cache, not a replacement. loadSubcommandSpec() in
 * hub-data.ts checks the registry first, then falls back to require().
 */

import * as fs from "fs"
import * as path from "path"

// ─── Config ───────────────────────────────────────────────────────────

const HUBS_DIR = path.join(__dirname, "hubs")
const OUTPUT_PATH = path.join(HUBS_DIR, "spec-registry.json")

// Fields from HubSubcommandSpec that are JSON-serializable
const SPEC_FIELDS = [
  "label", "description", "reminder", "skill", "agent", "command",
  "inline", "phases", "detailedDescription", "tools", "rules",
  "relatedSkills", "examples", "warnings",
] as const

// ─── Logic ────────────────────────────────────────────────────────────

function getHubDirs(): string[] {
  return fs.readdirSync(HUBS_DIR).filter((entry) => {
    const fullPath = path.join(HUBS_DIR, entry)
    return fs.statSync(fullPath).isDirectory()
  })
}

function getSpecFiles(hubDir: string): string[] {
  const fullPath = path.join(HUBS_DIR, hubDir)
  return fs.readdirSync(fullPath).filter(
    (entry) => entry.endsWith(".ts") && entry !== "index.ts"
  )
}

function extractSpec(hubDir: string, fileName: string): Record<string, unknown> | null {
  const filePath = path.join(HUBS_DIR, hubDir, fileName)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require(filePath)
    const spec = (mod.default || mod.spec) as Record<string, unknown>
    if (!spec || typeof spec !== "object") {
      return null
    }

    // Extract only the known serializable fields
    const entry: Record<string, unknown> = {}
    for (const field of SPEC_FIELDS) {
      if (field in spec) {
        entry[field] = spec[field]
      }
    }

    // Must have at least 'label' to be useful
    if (!entry.label) {
      return null
    }

    return entry
  } catch {
    return null
  }
}

function buildRegistry(): Record<string, Record<string, unknown>> {
  const registry: Record<string, Record<string, unknown>> = {}
  const hubDirs = getHubDirs()

  for (const hubDir of hubDirs) {
    const specFiles = getSpecFiles(hubDir)
    if (specFiles.length === 0) continue

    for (const fileName of specFiles) {
      const key = fileName.replace(/\.ts$/, "")
      const entry = extractSpec(hubDir, fileName)
      if (entry) {
        registry[`${hubDir}/${key}`] = entry
      }
    }
  }

  return registry
}

// ─── Main ─────────────────────────────────────────────────────────────

const WATCH_FLAGS = ["--watch", "-w"]

function main(): void {
  const isWatch = process.argv.slice(2).some((arg) => WATCH_FLAGS.includes(arg))

  const registry = buildRegistry()
  const count = Object.keys(registry).length

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(registry, null, 2), "utf-8")

  if (isWatch) {
    console.log("\nWatching for changes... (Ctrl+C to stop)")
    const dirs = getHubDirs().map((d) => path.join(HUBS_DIR, d))
    dirs.forEach((d) => {
      fs.watch(d, (eventType, fileName) => {
        if (fileName && fileName.endsWith(".ts") && fileName !== "index.ts") {
          console.log(`\nChange detected: ${fileName} (${eventType})`)
          // Rebuild — simple approach: clear require cache for the changed file
          const filePath = path.join(d, fileName)
          delete require.cache[require.resolve(filePath)]
          main()
        }
      })
    })
    // Keep process alive
    setInterval(() => {}, 60000)
  }
}

main()
