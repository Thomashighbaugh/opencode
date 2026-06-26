---
name: tag-resources
description: Scan, validate, and auto-tag global OpenCode resources (skills, agents, rules, archetypes) for resource_tags filtering. Used by /init-project, config maintenance, and by stack-recommender for accurate mapping.
tags: [meta, config, skills-management, automation]
---

# Tag Resources

Scans all global OpenCode resources — skills, agents, rules, and archetypes — and validates or suggests tag metadata for resource_tags-based filtering.

## When to Use

- After creating new skills, agents, or rules to ensure they're tagged for discoverability
- During config maintenance to audit tagging coverage
- Before running `stack-recommender` to ensure accurate mapping
- When a project uses `resource_tags` filtering and resources are missing from results

## Workflow

### Step 1: Scan All Resources

Check every resource for its tags frontmatter:

**Skills:** `~/.config/opencode/skills/*/SKILL.md`
**Agents:** `~/.config/opencode/agents/*.md`
**Rules:** `~/.config/opencode/rules/*.md`
**Archetypes:** `~/.config/opencode/archetypes/*/manifest.json`

### Step 2: Classify Each Resource

| Status           | Criteria                                      |
|------------------|-----------------------------------------------|
| ✅ Tagged         | Has valid tags frontmatter with ≥2 tags        |
| ⚠️ Minimal tags  | Has tags but only 1 tag (needs at least 2)     |
| ❌ Untagged       | No tags field in frontmatter                   |
| 🔧 Needs review  | Tags exist but are non-standard or misspelled  |

### Step 3: Suggest Tags

For each untagged resource, infer appropriate tags from its content:

- **Skill name/description** — extract language, framework, domain keywords
- **Agent role/success criteria** — infer function tags
- **Rule content** — infer conventions or domain tags
- **Archetype manifest** — ensure tags match the `resource_tags` it would generate

### Step 4: Report and Apply

```markdown
## Tag Audit Report

### Summary
- ✅ 72/95 skills tagged
- ⚠️ 12 skills with minimal tags (need at least 2)
- ❌ 8 skills untagged → suggest tags below
- ❌ 3 agents untagged
- ✅ All 14 rules tagged

### Missing Tags for [skill-name]

Suggested: `[typescript, api, conventions]`
Based on: Skill covers TypeScript API design patterns and naming conventions.

### Untagged Resources

| Resource | Type | Suggested Tags |
|----------|------|---------------|
| my-skill | skill | [typescript, react, testing] |
| my-agent | agent | [testing, playwright, e2e] |
| my-rule | rule | [conventions, python, django] |
```

### Step 5: Apply Tags (with user confirmation)

Before modifying any file, present the proposed changes and confirm:
- "Add suggested tags to [n] resources? (y/n)"
- "Skip any specific resources? (list indices or 'all')"

Apply by editing the frontmatter of each untagged resource.

## Tag Reference

See `~/.config/opencode/rules/resource-tags.md` for the complete tag vocabulary and conventions.

## Integration

### From init-project setup

Before `stack-recommender` runs, `tag-resources` can run to ensure complete coverage:

```
init-project detect → tag-resources (if needed) → stack-recommender → project-config-composer
```

### From config maintenance

```bash
# Run as standalone to audit
/harvest-context rule  # or direct invocation of tag-resources skill
```

### Automated gating

CI or post-commit hooks can run tag-resources to flag new untagged resources:
- Warn if a new skill is added without tags
- Block merge if tag coverage drops below 80%
