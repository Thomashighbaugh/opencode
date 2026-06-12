#!/usr/bin/env node

/**
 * check-agent-format.mjs
 * 
 * Validates that all agent .md files in agents/ follow the
 * <Agent_Prompt> XML wrapper convention.
 * 
 * Usage:
 *   node check-agent-format.mjs              # Check only, report issues
 *   node check-agent-format.mjs --fix         # Auto-fix non-compliant files
 *   node check-agent-format.mjs --verbose     # Detailed output
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT_DIR = path.resolve(fileURLToPath(import.meta.url), '..', '..', '..', '..');
const AGENTS_DIR = path.join(ROOT_DIR, 'agents');

const args = process.argv.slice(2);
const FIX = args.includes('--fix');
const VERBOSE = args.includes('--verbose');

function checkAgent(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const name = path.basename(filePath, '.md');
  const issues = [];

  // Check 1: YAML frontmatter
  if (!content.startsWith('---')) {
    issues.push('Missing YAML frontmatter (must start with ---)');
  }

  // Extract frontmatter
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) {
    issues.push('Cannot parse YAML frontmatter delimiters');
  } else {
    const fm = fmMatch[1];
    if (!fm.includes('description:')) issues.push('Missing description: in frontmatter');
    if (!fm.includes('model:')) issues.push('Missing model: in frontmatter');
    if (!fm.includes('mode:')) issues.push('Missing mode: in frontmatter');
  }

  // Check 2: Agent_Prompt wrapper
  if (!content.includes('<Agent_Prompt>')) issues.push('Missing <Agent_Prompt> opening tag');
  if (!content.includes('</Agent_Prompt>')) issues.push('Missing </Agent_Prompt> closing tag');

  // Check 3: Role sub-tag
  if (!content.includes('<Role>')) issues.push('Missing <Role> sub-tag inside Agent_Prompt');
  if (!content.includes('</Role>')) issues.push('Missing </Role> closing sub-tag');

  return { name, issues, content };
}

function fixAgent(content) {
  // Skip if already has Agent_Prompt wrapper
  if (content.includes('<Agent_Prompt>')) return content;

  // Find YAML frontmatter
  const fmMatch = content.match(/^(---[\s\S]*?---)\n*/);
  if (!fmMatch) return content;

  const frontmatter = fmMatch[1];
  const body = content.slice(fmMatch[0].length).trim();

  return `${frontmatter}\n\n<Agent_Prompt>\n  <Role>\n${body}\n  </Role>\n</Agent_Prompt>\n`;
}

async function main() {
  if (!fs.existsSync(AGENTS_DIR)) {
    console.error(`Agents directory not found: ${AGENTS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.md'));
  const results = [];

  for (const file of files) {
    const filePath = path.join(AGENTS_DIR, file);
    const result = checkAgent(filePath);
    results.push(result);
  }

  // Report
  const compliant = results.filter(r => r.issues.length === 0);
  const nonCompliant = results.filter(r => r.issues.length > 0);

  if (VERBOSE) {
    console.log(`\nAgent Format Check — ${results.length} agents\n`);
    for (const r of results) {
      const status = r.issues.length === 0 ? '✓' : '✗';
      console.log(`  ${status} ${r.name}`);
      if (r.issues.length > 0 && VERBOSE) {
        for (const issue of r.issues) {
          console.log(`      - ${issue}`);
        }
      }
    }
    console.log(`\n${compliant.length} compliant, ${nonCompliant.length} non-compliant\n`);
  }

  // Auto-fix
  if (FIX && nonCompliant.length > 0) {
    let fixed = 0;
    for (const r of nonCompliant) {
      if (r.issues.includes('Missing <Agent_Prompt> opening tag') || 
          r.issues.includes('Missing <Role> sub-tag')) {
        const newContent = fixAgent(r.content);
        const filePath = path.join(AGENTS_DIR, `${r.name}.md`);
        if (newContent !== r.content) {
          fs.writeFileSync(filePath, newContent, 'utf-8');
          console.log(`  ✓ Fixed: ${r.name}.md`);
          fixed++;
        }
      }
    }
    console.log(`\nFixed ${fixed} agent(s)\n`);
  }

  if (nonCompliant.length > 0 && !FIX) {
    console.log(`Use --fix to auto-wrap ${nonCompliant.length} non-compliant agent(s)`);
  }

  process.exit(nonCompliant.length > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Check failed:', err.message);
  process.exit(1);
});