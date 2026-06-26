---
name: readme-updater
description: Update README files to reflect current codebase state — scans agents, skills, tools, rules, commands, archetypes, and plugins; preserves existing tone, links, and structure; produces SEO-optimized, technically proficient documentation. Use when the user says "update the readme" or via /project readme.
level: 2
---

# Readme Updater

## Overview

This skill updates a project's README to accurately reflect the current codebase. It:

1. **Scans the codebase** — counts agents, skills, tools, rules, commands, archetypes, plugins, and other resources
2. **Reads the existing README** — preserves tone, voice, documentation links, and structural conventions
3. **Audits recent git history** — identifies new features, renamed capabilities, and removed components
4. **Updates stale numbers and descriptions** — replaces outdated counts, adds new sections, removes obsolete references
5. **Produces SEO-optimized output** — uses descriptive headings, natural keyword placement, and clear hierarchy

## When to Use

- The user says "update the readme" or "refresh the readme"
- The codebase has changed significantly (new agents, skills, tools, commands)
- The README references outdated counts or missing features
- A `/project readme` subcommand is invoked

## Process

### Step 1: Scan the Codebase

Collect current resource counts and metadata:

| Resource | Scan Method |
|----------|-------------|
| Agents | Count `agents/*.md` files (exclude `AGENTS.md`) |
| Skills | Count `skills/*/SKILL.md` directories |
| Tools | Count `tools/*.ts` files (exclude `AGENTS.md`) |
| Rules | Count `rules/*.md` files (exclude `AGENTS.md`) |
| Commands | Count `commands/*.md` files |
| Archetypes | Count `archetypes/*/` directories |
| Plugins | Count `plugins/*/` directories + npm plugins in `opencode.jsonc` |
| Docs | Count `.opencode/docs/*.md` files |

### Step 2: Read the Existing README

- Read the full README file
- Identify: tone (friendly, technical, formal), voice (first-person, third-person), documentation link patterns, section structure
- Note any stale numbers, missing features, or broken references

### Step 3: Audit Git History

- Check the last 20-30 commits for significant changes
- Identify: new features, renamed capabilities, removed components, deprecations

### Step 4: Update

- Update all resource counts to current values
- Add new sections for new capabilities
- Remove or update sections for removed/changed capabilities
- Preserve all existing documentation links (they point to `.opencode/docs/` or `.documentation/`)
- Maintain the existing tone and voice
- Keep SEO-friendly headings and keyword placement

### Step 5: Verify

- Confirm all links still resolve
- Confirm counts match actual filesystem state
- Confirm no sections were accidentally dropped

## Heuristics

- **Preserve documentation links** — if the README links to `.opencode/docs/agents.md`, keep that link even if you update the agent count
- **SEO headings** — use descriptive H2/H3 headings that include natural keywords (e.g., "Agents (31)" not "Agent Count")
- **Tone matching** — if the existing README uses "you" and friendly language, don't switch to dry academic tone
- **No emoji unless present** — match the existing emoji usage (or lack thereof)
- **Keep the license section** — always preserve the license at the bottom
- **Keep the quick start** — preserve any quick-start or getting-started sections
- **Update the tagline** — if the project description has evolved, update the tagline/header

## Output

The skill produces an updated README file with:
- Accurate current resource counts
- Up-to-date feature descriptions
- Preserved documentation links and structure
- Consistent tone with the original
- SEO-optimized headings and keyword placement
