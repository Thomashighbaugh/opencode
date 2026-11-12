/**
 * Promoted project-scoped tool: config-validator
 * 
 * Mechanical alternative to asking the model to review config files.
 * Validates JSON/YAML config files locally for syntax, required keys,
 * and common issues — zero inference tokens.
 * 
 * Promote to: <project>/.opencode/tools/config-validator.ts
 */

import { z } from "zod"
import { readFileSync, existsSync } from "node:fs"

export default {
  id: "config_validator",
  name: "config_validator",
  description: "Validate config files mechanically — syntax + required keys, no inference",
  parameters: z.object({
    file: z.string().describe("Path to config file (.json, .jsonc, .yaml, .yml)"),
    requiredKeys: z.array(z.string()).optional().describe("Keys that must be present"),
    forbidKeys: z.array(z.string()).optional().describe("Keys that must not be present"),
  }),
  async execute(input: { file: string; requiredKeys?: string[]; forbidKeys?: string[] }) {
    const { file, requiredKeys = [], forbidKeys = [] } = input
    
    if (!existsSync(file)) {
      return {
        content: `File not found: ${file}`,
        error: true,
      }
    }
    
    const ext = file.split(".").pop()?.toLowerCase()
    let parsed: any
    
    try {
      const raw = readFileSync(file, "utf8")
      if (ext === "json" || ext === "jsonc") {
        // Strip comments for JSONC
        const cleaned = raw.replace(/\/\/[^\n]*\n/g, "\n").replace(/\/\*[\s\S]*?\*\//g, "")
        parsed = JSON.parse(cleaned)
      } else if (ext === "yaml" || ext === "yml") {
        // Basic YAML check — just parse as JSON-compatible subset
        try {
          parsed = JSON.parse(raw)
        } catch {
          return {
            content: `YAML parsing not natively supported without a library. File ${file} appears to be YAML.`,
            error: true,
            format: "yaml",
          }
        }
      } else {
        return {
          content: `Unsupported file type: ${ext}. Use .json, .jsonc, .yaml, or .yml`,
          error: true,
        }
      }
    } catch (err) {
      return {
        content: `Parse error in ${file}: ${err instanceof Error ? err.message : String(err)}`,
        error: true,
      }
    }
    
    const issues: string[] = []
    const presentKeys = Object.keys(parsed)
    
    for (const key of requiredKeys) {
      if (!(key in parsed)) {
        issues.push(`Missing required key: ${key}`)
      }
    }
    
    for (const key of forbidKeys) {
      if (key in parsed) {
        issues.push(`Forbidden key present: ${key}`)
      }
    }
    
    // Check for common issues
    for (const key of presentKeys) {
      const val = parsed[key]
      if (val === null || val === undefined || val === "") {
        issues.push(`Empty/null value: ${key}`)
      }
      if (typeof val === "string" && val.includes("{{")) {
        issues.push(`Unresolved template variable: ${key}`)
      }
    }
    
    const status = issues.length === 0 ? "valid" : "issues_found"
    
    return {
      content: [
        `Config validation: ${file}`,
        `Status: ${status}`,
        `Keys: ${presentKeys.length}`,
        `Issues: ${issues.length}`,
        issues.length ? "" : "No issues found.",
        ...issues.map((i) => `  ⚠ ${i}`),
      ].filter(Boolean).join("\n"),
      status,
      issues,
      keys: presentKeys,
      tokensSaved: Math.round(presentKeys.length * 100), // estimated tokens not spent asking model
    }
  },
}
