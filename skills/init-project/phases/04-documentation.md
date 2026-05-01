# Phase 4: Documentation

Generate hierarchical AGENTS.md documentation across the codebase.

## Delegation

This phase delegates to the `deepinit` skill for documentation generation.

```
Invoke skill: deepinit
```

## Input

Read detection and plan results:
- `.opencode/state/init-detection.json` - Directory structure
- `.opencode/state/init-plan.json` - Mode and configuration

## Skip Condition

**Skip this phase if `--minimal` mode is active.**

Minimal mode only creates the root AGENTS.md (already done in Phase 3).

## Execution Steps

### Step 1: Invoke deepinit Skill

The deepinit skill handles:
- Directory hierarchy mapping
- AGENTS.md generation per directory
- Parent reference linking
- Manual section preservation

```
Read skill: ${SKILL_ROOT}/../deepinit/SKILL.md

Invoke with:
- directories: from detection results
- mode: inherit from init-project mode
```

### Step 2: Pass Detection Results

deepinit needs directory structure:

```bash
# Pass directories to deepinit
DIRECTORIES=$(jq -r '.directories[]' .opencode/state/init-detection.json)

# deepinit will:
# 1. Map all directories recursively
# 2. Generate AGENTS.md per directory
# 3. Create parent reference links
# 4. Add AI agent instructions
```

### Step 3: Configure deepinit Options

Based on init-project mode:

| Mode | deepinit Behavior |
|------|-------------------|
| `minimal` | Skip (only root AGENTS.md exists) |
| `full` | Full hierarchy with all directories |
| `refresh` | Preserve `<!-- MANUAL -->` sections |

### Step 4: deepinit Workflow

The deepinit skill executes:

1. **Map Directory Structure**
   ```
   Task(subagent_type="explore",
     prompt="List all directories recursively. Exclude: node_modules, .git, dist, build, __pycache__, .venv, coverage, .next, .nuxt")
   ```

2. **Create Work Plan**
   - Organize by depth level
   - Process parent levels before children

3. **Generate AGENTS.md Files**
   - For each directory (excluding ignored)
   - Analyze file purposes
   - Generate hierarchical documentation

4. **Validate Hierarchy**
   - Check parent references resolve
   - Verify no orphaned AGENTS.md files

## Generated Documentation Structure

```
/AGENTS.md                              ← Root (project overview)
├── src/AGENTS.md                       ← Source code overview
│   ├── components/AGENTS.md            ← UI components
│   ├── lib/AGENTS.md                   ← Utilities
│   └── pages/AGENTS.md                 ← Page routes
├── tests/AGENTS.md                     ← Test suites
└── docs/AGENTS.md                      ← Documentation
```

Each AGENTS.md includes:
- Purpose section
- Key files table
- Subdirectories table
- AI agent instructions
- Dependencies (internal/external)
- Manual section (preserved on refresh)

## Example AGENTS.md Output

For `src/components/`:

```markdown
<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2024-01-15T10:30:00Z | Updated: 2024-01-15T10:30:00Z -->

# components

## Purpose
Reusable React components organized by feature and complexity.

## Key Files

| File | Description |
|------|-------------|
| `Button.tsx` | Primary button component with variants |
| `Modal.tsx` | Modal dialog with focus trap |
| `index.ts` | Barrel export for components |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `forms/` | Form-related components (see `forms/AGENTS.md`) |
| `layout/` | Layout components (see `layout/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- Each component has its own file
- Use CSS modules for styling
- Export via barrel file (index.ts)

### Testing Requirements
- Unit tests in `__tests__/` subdirectory
- Use React Testing Library
- Coverage threshold: 80%

### Common Patterns
- Props interfaces defined above component
- Use forwardRef for DOM-exposing components
- Prefer functional components with hooks

## Dependencies

### Internal
- `src/hooks/` - Custom hooks
- `src/utils/` - Utility functions

### External
- `clsx` - Conditional class names
- `lucide-react` - Icons

<!-- MANUAL: Add component-specific notes below -->
```

## Integration with deepinit

The init-project skill activates deepinit with specific configuration:

```json
{
  "source": "init-project",
  "mode": "{minimal|full|refresh}",
  "directories": ["src", "tests", "docs", ".github"],
  "excludePatterns": [
    "node_modules",
    ".git",
    "dist",
    "build",
    "__pycache__",
    ".venv",
    "coverage",
    ".next",
    ".nuxt"
  ],
  "preserveManual": true
}
```

## Refresh Mode Handling

When `--refresh` is active:

1. **Read existing AGENTS.md**
   - Parse structure
   - Identify auto-generated sections
   - Extract `<!-- MANUAL -->` content

2. **Compare with current state**
   - New files added?
   - Files removed?
   - Structure changed?

3. **Merge updates**
   - Update auto-generated content
   - Preserve manual sections
   - Update timestamp

4. **Write merged result**

## Delegation Example

After deepinit skill is loaded:

```
Task(
  subagent_type="writer",
  prompt="Generate hierarchical AGENTS.md documentation for codebase.

Mode: {mode}
Detected directories: {directories}

For each directory:
1. Read files in directory
2. Analyze purpose and relationships
3. Generate AGENTS.md with:
   - Purpose section
   - Key files table
   - Subdirectories table
   - AI agent instructions
   - Dependencies section

Parent references: <!-- Parent: ../AGENTS.md -->

Start with root, then process depth-levels sequentially.
Exclude: node_modules, .git, dist, build, __pycache__, .venv

Write files to: {directory}/AGENTS.md"
)
```

## Output

After Phase 4:
- Root `AGENTS.md` (from Phase 3)
- Hierarchical `AGENTS.md` files per directory
- Parent references linking hierarchy
- Manual sections preserved (refresh mode)

## Checkpoint

Update checkpoint:
```json
{
  "lastCompletedPhase": 4,
  "timestamp": "2024-01-15T10:35:00Z",
  "filesAdded": [
    "src/AGENTS.md",
    "src/components/AGENTS.md",
    "tests/AGENTS.md"
  ]
}
```

## Next Phase

After documentation completes, proceed to **Phase 5: Verification**.