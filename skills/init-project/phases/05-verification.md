# Phase 5: Verification

Validate initialization completeness and configuration integrity.

## Delegation

```
Task(subagent_type="verifier",
  prompt="Verify init-project configuration completeness and integrity")
```

## Input

Read all generated files and checkpoint:
- `.opencode/opencode.jsonc`
- `.opencode/AGENTS.md`
- `.opencode/rules/*.md` (full mode)
- `.opencode/state/init-checkpoint.json`

## Verification Checks

### Check 1: File Existence

```bash
verify_files() {
    local errors=0

    # Required files
    local required=(
        ".opencode/opencode.jsonc"
        ".opencode/AGENTS.md"
        ".opencode/state"
    )

    for file in "${required[@]}"; do
        if [[ ! -e "$file" ]]; then
            echo "ERROR: Missing required file: $file"
            ((errors++))
        fi
    done

    # Full mode additional files
    if [[ "$MODE" == "full" ]]; then
        local full_required=(
            ".opencode/rules"
        )
        for file in "${full_required[@]}"; do
            if [[ ! -e "$file" ]]; then
                echo "ERROR: Missing full mode file: $file"
                ((errors++))
            fi
        done
    fi

    return $errors
}
```

### Check 2: opencode.jsonc Syntax

```bash
verify_jsonc() {
    local config=".opencode/opencode.jsonc"

    # Check JSONC is valid (basic check)
    if ! jq -e '.' "$config" > /dev/null 2>&1; then
        echo "ERROR: opencode.jsonc is not valid JSON"
        return 1
    fi

    # Check required fields
    local required_fields=("provider" "instructions")
    for field in "${required_fields[@]}"; do
        if ! jq -e ".$field" "$config" > /dev/null 2>&1; then
            echo "ERROR: Missing required field in opencode.jsonc: $field"
            return 1
        fi
    done

    echo "✓ opencode.jsonc syntax valid"
    return 0
}
```

### Check 3: AGENTS.md Structure

```bash
verify_agents_md() {
    local agents=".opencode/AGENTS.md"

    # Check file exists and has content
    if [[ ! -s "$agents" ]]; then
        echo "ERROR: AGENTS.md is empty or missing"
        return 1
    fi

    # Check for required sections
    local required_sections=("Overview" "Build Commands" "Code Style")
    for section in "${required_sections[@]}"; do
        if ! grep -q "## .*$section" "$agents" 2>/dev/null; then
            echo "WARNING: Missing recommended section in AGENTS.md: $section"
        fi
    done

    # Check for manual marker
    if ! grep -q "<!-- MANUAL" "$agents" 2>/dev/null; then
        echo "WARNING: Missing <!-- MANUAL --> marker in AGENTS.md"
    fi

    echo "✓ AGENTS.md structure valid"
    return 0
}
```

### Check 4: Rules Files (Full Mode)

```bash
verify_rules() {
    if [[ "$MODE" != "full" ]]; then
        return 0
    fi

    local rules_dir=".opencode/rules"
    local detection=$(cat .opencode/state/init-detection.json)
    local lang=$(echo "$detection" | jq -r '.language')

    # Check at least naming.md exists
    if [[ ! -f "$rules_dir/naming.md" ]]; then
        echo "ERROR: Missing naming.md in rules directory"
        return 1
    fi

    # Language should have corresponding rules
    local expected_rules=("naming.md" "patterns.md")
    for rule in "${expected_rules[@]}"; do
        if [[ ! -f "$rules_dir/$rule" ]]; then
            echo "WARNING: Missing expected rule file: $rule"
        fi
    done

    echo "✓ Rules files present"
    return 0
}
```

### Check 5: Parent References (Full Mode)

```bash
verify_parent_refs() {
    if [[ "$MODE" == "minimal" ]]; then
        return 0
    fi

    local errors=0

    # Find all AGENTS.md files (excluding root)
    find . -name "AGENTS.md" -type f -not -path "./AGENTS.md" | while read -r file; do
        local parent_ref=$(grep "<!-- Parent:" "$file" 2>/dev/null | head -1)

        if [[ -z "$parent_ref" ]]; then
            echo "ERROR: Missing parent reference in $file"
            ((errors++))
            continue
        fi

        # Extract parent path and verify it exists
        local parent_path=$(echo "$parent_ref" | sed 's/.*Parent: \([^ ]*\).*/\1/')
        local dir=$(dirname "$file")
        local parent_file="$dir/$parent_path"

        if [[ ! -f "$parent_file" ]]; then
            echo "ERROR: Broken parent reference in $file -> $parent_file"
            ((errors++))
        fi
    done

    if [[ $errors -eq 0 ]]; then
        echo "✓ Parent references valid"
    fi

    return $errors
}
```

### Check 6: .gitignore Updated

```bash
verify_gitignore() {
    local gitignore=".gitignore"

    if [[ ! -f "$gitignore" ]]; then
        echo "WARNING: No .gitignore file found"
        return 0
    fi

    if ! grep -q "^\.opencode/state/" "$gitignore" 2>/dev/null; then
        echo "ERROR: .gitignore missing .opencode/state/ entry"
        return 1
    fi

    echo "✓ .gitignore configured correctly"
    return 0
}
```

### Check 7: State Directory Structure

```bash
verify_state_dir() {
    local state_dir=".opencode/state"
    local required_dirs=("state" "plans" "logs" "artifacts")

    for dir in "${required_dirs[@]}"; do
        if [[ ! -d "$state_dir/$dir" ]]; then
            echo "ERROR: Missing state directory: $state_dir/$dir"
            return 1
        fi
    done

    echo "✓ State directories created"
    return 0
}
```

### Check 8: Config Loadability

```bash
verify_config_loads() {
    # Try to parse the config
    if ! jq -e '.' .opencode/opencode.jsonc > /dev/null 2>&1; then
        echo "ERROR: opencode.jsonc contains syntax errors"
        return 1
    fi

    # Check instructions path resolves
    if ! jq -e '.instructions' .opencode/opencode.jsonc > /dev/null 2>&1; then
        echo "WARNING: No instructions configured in opencode.jsonc"
    fi

    echo "✓ Configuration loads successfully"
    return 0
}
```

## Verification Report

Generate summary report:

```bash
generate_report() {
    local report_file=".opencode/state/init-report.md"

    cat > "$report_file" << REPORT_EOF
# Initialization Report

**Generated**: $(date -Iseconds)
**Mode**: $MODE
**Language**: $LANGUAGE
**Framework**: $FRAMEWORK

## Files Created

| File | Status |
|------|--------|
| `.opencode/opencode.jsonc` | $([ -f .opencode/opencode.jsonc ] && echo "✓" || echo "✗") |
| `.opencode/AGENTS.md` | $([ -f .opencode/AGENTS.md ] && echo "✓" || echo "✗") |
| `.opencode/state/` | $([ -d .opencode/state ] && echo "✓" || echo "✗") |
REPORT_EOF

    if [[ "$MODE" == "full" ]]; then
        cat >> "$report_file" << 'FULL_EOF'
| `.opencode/rules/` | $([ -d .opencode/rules ] && echo "✓" || echo "✗") |
| `.opencode/agent/` | $([ -d .opencode/agent ] && echo "✓" || echo "✗") |
| `.opencode/skills/` | $([ -d .opencode/skills ] && echo "✓" || echo "✗") |
FULL_EOF
    fi

    cat >> "$report_file" << 'FOOTER_EOF'

## Verification Results

REPORT_EOF

    # Add check results
    for check in "${CHECKS[@]}"; do
        echo "- $check" >> "$report_file"
    done

    cat >> "$report_file" << 'FOOTER_EOF'

## Next Steps

1. Review `.opencode/AGENTS.md` and customize for your project
2. Run `/deepinit` to create documentation hierarchy (if --minimal used)
3. Commit `.opencode/` to version control
4. Add project-specific agents or skills as needed

## Configuration Summary

FOOTER_EOF

    echo "- Language: $LANGUAGE" >> "$report_file"
    echo "- Framework: $FRAMEWORK" >> "$report_file"
    echo "- Package Manager: $PACKAGE_MANAGER" >> "$report_file"
    echo "- Build System: $BUILD_SYSTEM" >> "$report_file"
}
```

## Delegation Example

```
Task(
  subagent_type="verifier",
  prompt="Verify init-project completion.

Checklist:
1. File existence - all required files present
2. opencode.jsonc syntax - valid JSON/JSONC
3. AGENTS.md structure - required sections present
4. Rules files (full mode) - language rules copied
5. Parent references - hierarchy links valid
6. .gitignore updated - excludes .opencode/state/
7. State directories - all subdirectories exist
8. Config loadability - configuration parses correctly

Project root: $(pwd)
Mode: {mode}

Generate verification report to .opencode/state/init-report.md

Report pass/fail status for each check."
)
```

## Final Output

### Success

```
✓ Project initialized successfully

Detected:
  Language: {language}
  Framework: {framework}
  Package Manager: {packageManager}

Created:
  .opencode/opencode.jsonc     (Configuration)
  .opencode/AGENTS.md          (Project instructions)
  .opencode/rules/             (Language conventions)
  .opencode/state/             (Session state - gitignored)

Verified:
  ✓ All required files present
  ✓ Configuration syntax valid
  ✓ AGENTS.md structure complete
  ✓ Rules files present
  ✓ Parent references valid
  ✓ .gitignore configured
  ✓ State directories created
  ✓ Configuration loads successfully

Next steps:
  1. Review .opencode/AGENTS.md and customize
  2. Run /deepinit for documentation hierarchy (if needed)
  3. Commit .opencode/ to version control
```

### Failure

```
✗ Initialization failed

Errors:
  - Missing file: .opencode/rules/naming.md
  - Broken parent reference: src/components/AGENTS.md

Report saved to: .opencode/state/init-report.md

To retry:
  /init-project --force

To resume from last checkpoint:
  /init-project --resume
```

## Cleanup

On failure, offer rollback:

```bash
rollback_on_failure() {
    echo "Rolling back initialization..."
    rm -rf .opencode/
    git checkout .gitignore 2>/dev/null || true
    echo "Rollback complete"
}
```

## Checkpoint Completion

Update final checkpoint:

```json
{
  "lastCompletedPhase": 5,
  "timestamp": "2024-01-15T10:40:00Z",
  "status": "completed",
  "report": ".opencode/state/init-report.md"
}
```

## Exit

After successful verification:
- Display success message
- Show next steps
- Offer to run `deepinit` (if minimal mode)
- Remind to commit changes