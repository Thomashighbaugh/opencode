---
description: Manage OpenCode skills - list, add, remove, edit, search, create, update, package, validate, sync, setup, scan
argument-hint: "<subcommand> [args]"
---

# Skill Manager

Unified command for managing OpenCode Hubs skills. Covers CRUD, search, sync, packaging, and validation.

## Subcommands

### /skills list

Show all available skills organized by scope.

**Behavior:**
1. Scan built-in skills in `skills/` directory (read-only)
2. Scan user skills at `${OPENCODE_CONFIG_DIR:-~/.config/opencode}/skills/omc-learned/`
3. Scan project skills at `.opencode/state/skills/`
4. Scan plugin skill categories at `${OPENCODE_CONFIG_DIR:-~/.config/opencode}/skills/*-category-pointer/` (if `opencode-skills-collection` plugin is installed)
5. Parse YAML frontmatter for metadata
6. Display in organized table format:

```
BUILT-IN SKILLS (64 bundled):
| Name              | Description                    | Scope    |
|-------------------|--------------------------------|----------|
| visual-verdict    | Structured visual QA verdicts  | built-in |
| ralph             | Persistence loop               | built-in |

PLUGIN SKILL CATEGORIES (opencode-skills-collection):
| Category                    | Skills | Hub Access              |
|------------------------------|--------|-------------------------|
| development                  | 136    | /project, /skills        |
| security                     | 73     | /project, /skills        |
| workflow                     | 53     | /orchestrate, /skills    |
| ai-ml                        | 103    | /skills                  |
| ...                          | ...    | ...                     |

USER SKILLS (~/.config/opencode/skills/omc-learned/):
| Name              | Triggers           | Quality | Usage | Scope |
|-------------------|--------------------|---------|-------|-------|
| error-handler     | fix, error         | 95%     | 42    | user  |

PROJECT SKILLS (.opencode/state/skills/):
| Name              | Triggers           | Quality | Usage | Scope |
|-------------------|--------------------|---------|-------|-------|
| test-runner       | test, run          | 92%     | 15    | project |
```

**Plugin categories:** When the `opencode-skills-collection` plugin is installed, category pointers appear as `*-category-pointer` directories in the skills folder. Each pointer's SKILL.md lists all skills in that category. Skills are loaded on demand via `view_file` from the vault at `~/.config/opencode/skill-libraries/`.

**Hub routing for plugin skills:** Use the hub access column to determine which hub can invoke skills from each category:
- `/ideation` → planning, brainstorming, research categories
- `/orchestrate` → workflow, automation, agent-orchestration categories
- `/harvest-context` → meta, memory, content categories
- `/project` → development, devops, testing, security categories
- `/skills` → all categories (universal access)

**Fallback:** If quality/usage stats not available, show "N/A"
**Note:** Built-in skills are discoverable/readable but cannot be removed or edited. Plugin skills are loaded on demand and don't add `/` command completions.

---

### /skills add [name]

Interactive wizard for creating a new skill.

**Behavior:**
1. **Ask for skill name** (if not provided) - lowercase, hyphens only
2. **Ask for description** - clear, concise one-liner
3. **Ask for triggers** (comma-separated keywords)
4. **Ask for argument hint** (optional)
5. **Ask for scope:**
   - `user` → `${OPENCODE_CONFIG_DIR:-~/.config/opencode}/skills/omc-learned/<name>/SKILL.md`
   - `project` → `.opencode/state/skills/<name>/SKILL.md`
6. **Create skill** using `skill-creator` skill process:
   - Run `scripts/init_skill.py <skill-name> --path <scope-dir>`
   - Write SKILL.md with frontmatter and workflow
   - Add bundled resources (scripts/, references/, assets/) as needed
7. **Report success** with file path
8. **Suggest:** `/skills edit <name>` to customize

---

### /skills remove <name>

Remove a skill by name.

**Behavior:**
1. Search for skill in user and project scopes
2. If found: display info, ask for confirmation
3. If confirmed: delete entire skill directory
4. If not found: report error with suggestion to use `/skills search`

**Safety:** Never delete without explicit user confirmation.

---

### /skills edit <name>

Edit an existing skill interactively.

**Behavior:**
1. Find skill by name (search both scopes)
2. Read current content
3. Display current values
4. Ask what to change: `description`, `triggers`, `argument-hint`, `content`, `rename`, `cancel`
5. Update selected field, write back
6. Report success

---

### /skills search <query>

Search skills by content, triggers, name, or description.

**Behavior:**
1. Scan all skills in both scopes
2. Match query (case-insensitive) against: name, description, triggers, content
3. Display matches ranked by relevance (name/triggers > content)

---

### /skills info <name>

Show detailed information about a skill.

**Behavior:**
1. Find skill by name
2. Parse YAML frontmatter and content
3. Display complete details including full content

---

### /skills create <name>

Create a new skill using the full `skill-creator` workflow (deeper than `add`).

**Behavior:**
1. Gather requirements: purpose, use cases, trigger context
2. Plan reusable contents: scripts, references, assets
3. Initialize with `scripts/init_skill.py`
4. Write SKILL.md with full procedural knowledge
5. Package if ready

Use `create` for complex skills requiring bundled resources. Use `add` for quick skills.

---

### /skills update <name>

Update an existing skill using the `skill-creator` iteration workflow.

**Behavior:**
1. Read skill and bundled resources
2. Identify improvements with user
3. Apply changes to SKILL.md and resources
4. Validate structure

---

### /skills package <name>

Package skill for distribution.

**Behavior:**
1. Validate: `scripts/package_skill.py ~/.config/opencode/skills/<name>`
2. Create distributable zip if validation passes

---

### /skills validate <name>

Validate skill structure without packaging.

**Behavior:**
1. Run validation checks from `package_skill.py`
2. Report any errors

---

### /skills sync

Sync skills between user and project scopes.

**Behavior:**
1. Scan both scopes, compare
2. Categorize: user-only, project-only, common
3. Display sync opportunities
4. Handle user choice: copy, diff, cancel

**Safety:** Never overwrite without confirmation.

---

### /skills setup

Interactive wizard for setting up skill directories and managing local skills.

**Behavior:**
1. Check/create directories: `skills/omc-learned/` and `.opencode/state/skills/`
2. Scan and inventory skills in both directories
3. Offer actions: add, list, scan conversation, import, done

---

### /skills scan

Quick scan of both skill directories (non-interactive version of setup Step 2).

---

## Skill Anatomy

```
skill-name/
├── SKILL.md           # Required: Main skill definition
│   ├── name:          # Skill identifier
│   └── description:   # When to use (trigger context)
├── scripts/           # Optional: Executable scripts
├── references/        # Optional: Documentation to load
└── assets/            # Optional: Output files (templates, etc.)
```

## Writing Guidelines

- Use **imperative/infinitive form** (verb-first)
- Be specific about trigger context in description
- Show ONE canonical example, not 20 scenarios
- Keep SKILL.md under 5k words
- Put detailed docs in `references/`
- Put reusable scripts in `scripts/`
- Put output resources in `assets/`

## Skill Templates

When creating skills, offer these templates:

### Error Solution
```markdown
---
name: [Error Name]
description: Solution for [specific error in specific context]
triggers: ["error message fragment", "file path", "symptom"]
---

# [Error Name]

## The Insight
[Underlying cause / principle discovered]

## Recognition Pattern
- Error message: "[exact error]"
- File: [specific file path]
- Context: [when this occurs]

## The Approach
1. [Specific action with file/line reference]
2. [Specific action with file/line reference]
3. [Verification step]
```

### Workflow Skill
```markdown
---
name: [Workflow Name]
description: Process for [specific task in this codebase]
triggers: ["task description", "file pattern", "goal keyword"]
---

# [Workflow Name]

## The Insight
[What makes this workflow different from the obvious approach]

## Recognition Pattern
- Task type: [specific task]
- Files involved: [specific patterns]

## The Approach
1. [Step with specific commands/files]
2. [Step with specific commands/files]
3. [Verification]
```

### Code Pattern
```markdown
---
name: [Pattern Name]
description: Pattern for [specific use case in this codebase]
triggers: ["code pattern", "file type", "problem domain"]
---

# [Pattern Name]

## The Insight
[Key principle behind this pattern]

## Recognition Pattern
- File types: [specific files]
- Problem: [specific problem]

## The Approach
1. [Principle-based step]
2. [Principle-based step]

## Anti-Pattern
[What NOT to do and why]
```

## Error Handling

All commands must handle:
- File/directory doesn't exist
- Permission errors
- Invalid YAML frontmatter
- Duplicate skill names
- Invalid skill names (spaces, special chars)

**Error format:**
```
✗ Error: <clear message>
→ Suggestion: <helpful next step>
```

## Examples

```
/skills list                           # List all skills
/skills add my-custom-skill            # Quick-add a skill
/skills create github-ops              # Full creation workflow
/skills update changelog-generator     # Update existing skill
/skills edit error-handler             # Edit skill interactively
/skills remove old-skill               # Remove a skill
/skills search typescript error        # Search for skills
/skills info my-custom-skill           # Show skill details
/skills package github-ops             # Package for distribution
/skills validate my-skill              # Validate structure
/skills sync                           # Sync between scopes
/skills setup                          # Setup wizard
/skills scan                           # Quick scan
```

## Related

- `skill-creator` skill - Deep creation guide and process
- `learner` skill / `/learner` - Extract a skill from current conversation
- AGENTS.md - Skill loading mechanism