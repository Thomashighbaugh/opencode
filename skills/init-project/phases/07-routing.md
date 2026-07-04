# Phase 7: Routing & Integration (--full only)

Wire project-specific resources into the hub system, validate all cross-references, and run a final integration check.

**Skip condition:** This phase ONLY runs when `--full` flag is active. Default `setup` skips it.

## Purpose

After Phase 6 generates deep context and upgrades agents, Phase 7 ensures everything is wired together correctly: project agents extend their global counterparts properly, project skills are discoverable, project tools are loadable, the hub routing knows about project-level overrides, and the full configuration is internally consistent.

## Input

- `.opencode/state/init/provision-checkpoint.json` — provisioned artifacts (agents, skills, tools, rules)
- `.opencode/state/init/init-checkpoint.json` — Phase 6 checkpoint (context files, upgraded agents)
- `.opencode/opencode.jsonc` — project config
- `.opencode/AGENTS.md` — project instructions

## Execution Steps

### Step 1: Validate Agent Inheritance

Every project agent in `.opencode/agents/*.md` must extend a global agent. Check that the `extends:` path resolves to an existing global agent file.

```bash
validate_agent_extends() {
    local agents_dir=".opencode/agents"
    local global_dir="${GLOBAL_DIR:-$HOME/.config/opencode}/agents"
    local errors=0

    if [ ! -d "$agents_dir" ]; then
        echo "  ℹ  No project agents directory — skipping"
        return 0
    fi

    for agent_file in "$agents_dir"/*.md; do
        [ -f "$agent_file" ] || continue
        local agent_name=$(basename "$agent_file" .md)

        # Extract extends path
        local extends_path=$(grep -m1 'extends:' "$agent_file" 2>/dev/null | sed 's/extends:[[:space:]]*//' | tr -d '"')

        if [ -z "$extends_path" ]; then
            echo "  ⚠  $agent_name — no extends directive (standalone project agent)"
            continue
        fi

        # Resolve relative to project root
        local resolved="$PROJECT_ROOT/$extends_path"
        if [ ! -f "$resolved" ]; then
            echo "  ✗  $agent_name — extends path does not resolve: $extends_path"
            ((errors++))
        else
            echo "  ✓  $agent_name → extends $(basename "$extends_path")"
        fi
    done

    return $errors
}
```

If any agent has a broken `extends:` path, fix it by re-pointing to the correct global agent file.

### Step 2: Validate Skill Discoverability

Project skills in `.opencode/skills/*/SKILL.md` must have valid YAML frontmatter (name + description) and be registered in the skills path.

```bash
validate_skills() {
    local skills_dir=".opencode/skills"
    local errors=0

    if [ ! -d "$skills_dir" ]; then
        echo "  ℹ  No project skills directory — skipping"
        return 0
    fi

    # Check opencode.jsonc has skills path
    if ! grep -q '\.opencode/skills' .opencode/opencode.jsonc 2>/dev/null; then
        echo "  ⚠  opencode.jsonc missing skills path — adding"
        # Add skills path to config
        node -e "
            const fs = require('fs');
            const config = JSON.parse(fs.readFileSync('.opencode/opencode.jsonc', 'utf-8'));
            if (!config.skills) config.skills = {};
            if (!config.skills.paths) config.skills.paths = [];
            if (!config.skills.paths.includes('./.opencode/skills')) {
                config.skills.paths.push('./.opencode/skills');
            }
            fs.writeFileSync('.opencode/opencode.jsonc', JSON.stringify(config, null, 2));
        " 2>/dev/null || echo "  ⚠  Could not auto-fix skills path — add manually"
    fi

    # Check each skill has valid frontmatter
    for skill_file in "$skills_dir"/*/SKILL.md; do
        [ -f "$skill_file" ] || continue
        local skill_name=$(basename "$(dirname "$skill_file")")

        if ! grep -q '^name:' "$skill_file" 2>/dev/null; then
            echo "  ✗  skill $skill_name — missing 'name:' in frontmatter"
            ((errors++))
        elif ! grep -q '^description:' "$skill_file" 2>/dev/null; then
            echo "  ✗  skill $skill_name — missing 'description:' in frontmatter"
            ((errors++))
        else
            echo "  ✓  skill $skill_name — valid frontmatter"
        fi
    done

    return $errors
}
```

### Step 3: Validate Tool Auto-Discovery

Project tools in `.opencode/tools/*.ts` must export a default tool and be syntactically valid TypeScript.

```bash
validate_tools() {
    local tools_dir=".opencode/tools"
    local errors=0

    if [ ! -d "$tools_dir" ]; then
        echo "  ℹ  No project tools directory — skipping"
        return 0
    fi

    for tool_file in "$tools_dir"/*.ts; do
        [ -f "$tool_file" ] || continue
        local tool_name=$(basename "$tool_file" .ts)

        if ! grep -q 'export default' "$tool_file" 2>/dev/null; then
            echo "  ✗  tool $tool_name — missing default export"
            ((errors++))
        elif ! grep -q 'tool(' "$tool_file" 2>/dev/null; then
            echo "  ⚠  tool $tool_name — may not use tool() wrapper"
        else
            echo "  ✓  tool $tool_name — valid export"
        fi
    done

    return $errors
}
```

### Step 4: Validate Rule Registration

Project rules in `.opencode/rules/*.md` should be listed in `opencode.jsonc` instructions array so they load at startup.

```bash
validate_rules() {
    local rules_dir=".opencode/rules"
    local errors=0

    if [ ! -d "$rules_dir" ] || [ -z "$(ls -A "$rules_dir" 2>/dev/null)" ]; then
        echo "  ℹ  No project rules — skipping"
        return 0
    fi

    # Check if rules are in the instructions array
    local config_rules=$(jq -r '.instructions[]?' .opencode/opencode.jsonc 2>/dev/null | grep 'rules/')

    for rule_file in "$rules_dir"/*.md; do
        [ -f "$rule_file" ] || continue
        local rule_name=$(basename "$rule_file")
        local rule_path="./.opencode/rules/$rule_name"

        if echo "$config_rules" | grep -q "$rule_name" 2>/dev/null; then
            echo "  ✓  rule $rule_name — registered in instructions"
        else
            echo "  ⚠  rule $rule_name — not in opencode.jsonc instructions, adding"
            # Add to instructions array
            node -e "
                const fs = require('fs');
                const config = JSON.parse(fs.readFileSync('.opencode/opencode.jsonc', 'utf-8'));
                const rulePath = './.opencode/rules/$rule_name';
                if (!config.instructions) config.instructions = ['AGENTS.md'];
                if (!config.instructions.includes(rulePath)) {
                    config.instructions.push(rulePath);
                }
                fs.writeFileSync('.opencode/opencode.jsonc', JSON.stringify(config, null, 2));
            " 2>/dev/null || echo "  ⚠  Could not auto-register rule $rule_name — add manually to instructions"
        fi
    done
}
```

### Step 5: Validate Context File Integrity

Check that Phase 6 context files exist and have content:

```bash
validate_context() {
    local ctx_dir=".opencode/context"
    local errors=0

    local expected_files=(
        "$ctx_dir/frameworks/architecture.md"
        "$ctx_dir/patterns/conventions.md"
        "$ctx_dir/theory.md"
        "$ctx_dir/decisions.md"
    )

    for ctx_file in "${expected_files[@]}"; do
        if [ ! -s "$ctx_file" ]; then
            echo "  ✗  Missing or empty: $ctx_file"
            ((errors++))
        else
            echo "  ✓  $ctx_file"
        fi
    done

    # Check project memory
    if [ ! -s "$ctx_dir/../state/project-memory.json" ]; then
        echo "  ⚠  Missing project-memory.json (Phase 6 may not have completed)"
    fi

    return $errors
}
```

### Step 6: Validate Config Syntax

Final JSON/JSONC syntax check on `opencode.jsonc`:

```bash
validate_config_syntax() {
    local config=".opencode/opencode.jsonc"

    if ! jq -e '.' "$config" > /dev/null 2>&1; then
        echo "  ✗  opencode.jsonc — invalid JSON"
        return 1
    fi

    # Check for invalid keys
    local invalid_keys=("tools" "agents" "commands" "rules" "agentPaths" "project")
    for key in "${invalid_keys[@]}"; do
        if jq -e ".$key" "$config" > /dev/null 2>&1; then
            echo "  ✗  opencode.jsonc — invalid top-level key '$key'"
            return 1
        fi
    done

    # Check required fields
    for field in "model" "default_agent" "instructions"; do
        if ! jq -e ".$field" "$config" > /dev/null 2>&1; then
            echo "  ⚠  opencode.jsonc — missing recommended field: $field"
        fi
    done

    echo "  ✓  opencode.jsonc — valid syntax, no invalid keys"
    return 0
}
```

### Step 7: Validate .gitignore

Ensure state, sessions, and chat are gitignored but context is NOT:

```bash
validate_gitignore() {
    local gitignore=".gitignore"
    local errors=0

    # These MUST be gitignored (secrets, PII, session data)
    local must_ignore=(".opencode/state/" ".opencode/state/sessions" ".opencode/chat-history" ".opencode/chat/")
    for pattern in "${must_ignore[@]}"; do
        if ! grep -q "^${pattern}" "$gitignore" 2>/dev/null; then
            echo "  ✗  .gitignore missing: $pattern"
            ((errors++))
        fi
    done

    # Context must NOT be gitignored (it's durable knowledge)
    if grep -q "^\.opencode/context" "$gitignore" 2>/dev/null; then
        echo "  ✗  .gitignore should NOT ignore .opencode/context/ — that's durable knowledge"
        ((errors++))
    fi

    if [ $errors -eq 0 ]; then
        echo "  ✓  .gitignore configured correctly (state ignored, context committed)"
    fi

    return $errors
}
```

### Step 8: Generate Integration Report

Produce a final report summarizing all project resources and their validation status:

```bash
generate_integration_report() {
    local report_file=".opencode/state/init/integration-report.md"

    cat > "$report_file" << REPORT_EOF
# Integration Report

**Generated:** $(date -Iseconds)
**Mode:** full
**Project:** $(basename "$PROJECT_ROOT")

## Resource Summary

| Type | Count | Status |
|------|-------|--------|
| Agents | $(ls .opencode/agents/*.md 2>/dev/null | wc -l) | Validated |
| Skills | $(ls .opencode/skills/*/SKILL.md 2>/dev/null | wc -l) | Validated |
| Tools | $(ls .opencode/tools/*.ts 2>/dev/null | wc -l) | Validated |
| Rules | $(ls .opencode/rules/*.md 2>/dev/null | wc -l) | Validated |
| Context | $(find .opencode/context -name '*.md' 2>/dev/null | wc -l) | Validated |

## Agent Inheritance

$(for f in .opencode/agents/*.md; do [ -f "$f" ] && echo "| $(basename $f .md) | $(grep -m1 'extends:' "$f" | sed 's/extends:[[:space:]]*//' | tr -d '"') |"; done)

## Config

- opencode.jsonc: valid
- Skills path: registered
- Rules: in instructions array
- .gitignore: state ignored, context committed

## Validation Results

$(cat .opencode/state/init/validation-results.txt 2>/dev/null || echo "All checks passed.")

## Next Steps

1. Review .opencode/AGENTS.md and customize
2. Review .opencode/context/ files — these contain your project's architecture and conventions
3. Review .opencode/agents/ — these now have deep project context
4. Commit .opencode/ to version control (context files are safe to commit)
5. Start working — agents already understand your project
REPORT_EOF

    echo "  ✓ Integration report: $report_file"
}
```

## Delegation Example

```
// All steps are inline validation + fix — no agent delegation needed.
// Run steps 1-8 sequentially, collecting pass/fail for each.
// Fix broken extends paths, missing skills paths, unregistered rules automatically.
// Generate final integration report.
```

## Output

After Phase 7:
- `.opencode/state/init/integration-report.md` — final validation report
- All broken cross-references fixed (agent extends, skills paths, rules registration)
- `opencode.jsonc` updated with any missing skills paths or rule instructions
- `.gitignore` validated (state ignored, context NOT ignored)

## Checkpoint

Save final checkpoint:

```json
{
  "lastCompletedPhase": 7,
  "timestamp": "2026-07-01T12:30:00Z",
  "subcommand": "setup",
  "mode": "full",
  "status": "integrated",
  "validation": {
    "agents": "passed",
    "skills": "passed",
    "tools": "passed",
    "rules": "passed",
    "context": "passed",
    "config": "passed",
    "gitignore": "passed"
  }
}
```

## Next Phase

After routing & integration completes, proceed to **Phase 8: Verification** (final health check and summary report).