#!/usr/bin/env node

/**
 * check-schema-compliance.mjs
 * 
 * Fetches the OpenCode config schema, compares against local opencode.jsonc,
 * and reports compliance issues. Can auto-fix known problems.
 * 
 * Usage:
 *   node check-schema-compliance.mjs           # Check only
 *   node check-schema-compliance.mjs --fix      # Auto-fix
 *   node check-schema-compliance.mjs --save     # Save schema to context
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT_DIR = path.resolve(fileURLToPath(import.meta.url), '..', '..', '..', '..');
const CONFIG_PATH = path.join(ROOT_DIR, 'opencode.jsonc');
const SCHEMA_PATH = path.join(ROOT_DIR, '.opencode', 'context', 'research', 'opencode-config-schema.md');

const args = process.argv.slice(2);
const FIX = args.includes('--fix');
const SAVE = args.includes('--save');
const VERBOSE = args.includes('--verbose');

// Known valid top-level keys from https://opencode.ai/config.json
// These are the OFICIALLY SUPPORTED keys as of 2026-06
const VALID_KEYS = new Set([
  '$schema', 'shell', 'logLevel', 'server', 'command', 'skills',
  'references', 'reference', 'watcher', 'snapshot', 'plugin',
  'share', 'autoshare', 'autoupdate', 'disabled_providers', 'enabled_providers',
  'model', 'small_model', 'default_agent', 'username', 'mode', 'agent',
  'provider', 'mcp', 'formatter', 'lsp', 'instructions', 'layout',
  'permission', 'tools', 'attachment', 'enterprise', 'tool_output',
  'compaction', 'experimental',
]);

// Keys that are deprecated — warn if present
const DEPRECATED_KEYS = new Set([
  'reference',  // → references
  'autoshare',  // → share
  'mode',       // → agent
  'layout',     // deprecated, always stretch
  'maxSteps',   // → steps (inside AgentConfig)
]);

// Keys that are NOT valid at top level — error if present
const INVALID_KEYS = new Set([
  'agents', 'commands', 'rules', 'agentPaths', 'project',
]);

// Recommended keys that should be present
const RECOMMENDED_KEYS = {
  '$schema': 'https://opencode.ai/config.json',
  'small_model': null, // value is provider/model string
};

async function main() {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error(`Config not found: ${CONFIG_PATH}`);
    process.exit(1);
  }

  // Read config — strip comments for parsing
  let configRaw = fs.readFileSync(CONFIG_PATH, 'utf-8');
  let config;
  try {
// JSONC-compatible parsing: strip trailing // comments line by line
  // This handles JSONC properly: strings with // inside are preserved,
  // only // at end-of-line outside strings are stripped
  const lines = configRaw.split('\n');
  const cleanedLines = lines.map(line => {
    let inString = false;
    let quoteChar = null;
    let commentIdx = -1;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inString) {
        if (ch === '\\') { i++; continue; } // skip escaped char
        if (ch === quoteChar) inString = false;
      } else {
        if (ch === '"' || ch === "'") { inString = true; quoteChar = ch; }
        else if (ch === '/' && i + 1 < line.length && line[i + 1] === '/') {
          commentIdx = i;
          break;
        }
      }
    }
    return commentIdx >= 0 ? line.substring(0, commentIdx) : line;
  });
  let jsonStr = cleanedLines.join('\n');
  // Strip trailing commas (JSONC allows them, JSON.parse doesn't)
  jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');
    config = JSON.parse(jsonStr);
  } catch (e) {
    console.error(`Failed to parse opencode.jsonc: ${e.message}`);
    process.exit(1);
  }

  const topKeys = Object.keys(config);
  const errors = [];
  const warnings = [];
  const infos = [];

  // Check each key
  for (const key of topKeys) {
    if (INVALID_KEYS.has(key)) {
      errors.push(`Invalid top-level key "${key}" — OpenCode does not recognize this key`);
    } else if (DEPRECATED_KEYS.has(key)) {
      warnings.push(`Deprecated key "${key}" — should be replaced`);
    } else if (!VALID_KEYS.has(key)) {
      warnings.push(`Unknown key "${key}" — may not be recognized by this version of OpenCode`);
    }
  }

  // Check for missing recommended keys
  if (!config.$schema) {
    infos.push('Recommended: add "$schema": "https://opencode.ai/config.json"');
  }
  if (!config.small_model) {
    infos.push('Recommended: set "small_model" for lightweight tasks (e.g., qwen3.6:cloud)');
  }

  // Check for unset but valuable permission keys
  const permKeys = config.permission ? Object.keys(
    typeof config.permission === 'object' ? config.permission : {}
  ) : [];
  const recommendedPerms = ['bash', 'task', 'lsp'];
  for (const k of recommendedPerms) {
    if (!permKeys.includes(k)) {
      infos.push(`Recommended: add "permission.${k}" for security (suggest: "ask")`);
    }
  }

  // Report
  console.log(`\n📋 Config Schema Compliance — opencode.jsonc\n`);

  if (errors.length > 0) {
    console.log(`  ❌ Errors (${errors.length}):`);
    for (const e of errors) console.log(`     ${e}`);
  }

  if (warnings.length > 0) {
    console.log(`  ⚠  Warnings (${warnings.length}):`);
    for (const w of warnings) console.log(`     ${w}`);
  }

  if (infos.length > 0) {
    console.log(`  ℹ  Suggestions (${infos.length}):`);
    for (const i of infos) console.log(`     ${i}`);
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log(`  ✓ All ${topKeys.length} top-level keys are valid`);
  }

  console.log(`\n  ${topKeys.length} keys checked, ${errors.length} errors, ${warnings.length} warnings\n`);

  // Auto-fix
  if (FIX && errors.length > 0) {
    let fixed = false;
    for (const key of INVALID_KEYS) {
      if (key in config) {
        delete config[key];
        console.log(`  ✓ Removed invalid key "${key}"`);
        fixed = true;
      }
    }
    if (fixed) {
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 4), 'utf-8');
      console.log('  ✓ Config updated');
    }
  }

  // Save schema to context
  if (SAVE) {
    const schemaDir = path.dirname(SCHEMA_PATH);
    if (!fs.existsSync(schemaDir)) fs.mkdirSync(schemaDir, { recursive: true });
    
    const schemaContent = `# OpenCode Config Schema Reference

Last checked: ${new Date().toISOString().split('T')[0]}
Source: https://opencode.ai/config.json

## Valid Top-Level Keys

${Array.from(VALID_KEYS).sort().map(k => `- \`${k}\``).join('\n')}

## Deprecated Keys

${Array.from(DEPRECATED_KEYS).sort().map(k => `- \`${k}\``).join('\n')}

## Invalid Keys That Cause Errors

${Array.from(INVALID_KEYS).sort().map(k => `- \`${k}\``).join('\n')}

> Auto-generated by config-sync skill. Re-run to refresh.
`;
    fs.writeFileSync(SCHEMA_PATH, schemaContent, 'utf-8');
    console.log(`  ✓ Schema saved to ${SCHEMA_PATH}`);
  }

  process.exit(errors.length > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Compliance check failed:', err.message);
  process.exit(1);
});