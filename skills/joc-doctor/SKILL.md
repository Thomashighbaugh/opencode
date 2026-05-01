---
name: joc-doctor
description: Diagnose and fix OpenCode JOC installation issues for self-managed global file installations
level: 3
---

# JOC Doctor

Diagnose and fix issues with an OpenCode JOC self-managed global file installation at `~/.config/opencode/`.

Note: All `~/.config/opencode/...` paths respect `OPENCODE_CONFIG_DIR` when set.

## Task: Run Installation Diagnostics

### Step 1: Check Global Directory Structure

```bash
GLOBAL_DIR="${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}"

echo "=== Global JOC Directory ==="

if [ -d "$GLOBAL_DIR" ]; then
  echo "✓ Directory exists: $GLOBAL_DIR"
else
  echo "✗ Directory MISSING: $GLOBAL_DIR"
  echo "  → Run /init-project to create it"
  CRITICAL_COUNT=$((CRITICAL_COUNT + 1))
fi

# Essential files
for f in AGENTS.md opencode.jsonc; do
  if [ -f "$GLOBAL_DIR/$f" ]; then
    echo "  ✓ $f"
  else
    echo "  ✗ $f MISSING"
    CRITICAL_COUNT=$((CRITICAL_COUNT + 1))
  fi
done

# Essential directories
for d in skills commands agents plugins rules tools templates state docs; do
  if [ -d "$GLOBAL_DIR/$d" ]; then
    COUNT=$(ls "$GLOBAL_DIR/$d" 2>/dev/null | wc -l)
    echo "  ✓ $d/ ($COUNT items)"
  else
    echo "  ✗ $d/ MISSING"
    WARN_COUNT=$((WARN_COUNT + 1))
  fi
done
```

### Step 2: Check opencode.jsonc

```bash
GLOBAL_DIR="${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}"
CONFIG="$GLOBAL_DIR/opencode.jsonc"

if [ -f "$CONFIG" ]; then
  # Check it's readable and has key fields
  if node -e "const c=require('fs').readFileSync('$CONFIG','utf8').replace(/\/\/.*$/gm,'').replace(/\/\*[\s\S]*?\*\//g,''); const j=JSON.parse(c); ['provider','instructions','skills'].forEach(k=>{if(!j[k])throw new Error(k+' missing')}); console.log('✓ Valid config with provider, instructions, skills')" 2>/dev/null; then
    echo "  Config structure OK"
  else
    echo "  ✗ Config missing required fields or has syntax errors"
    CRITICAL_COUNT=$((CRITICAL_COUNT + 1))
  fi

  # Check skills.paths includes local skills
  if node -e "const c=require('fs').readFileSync('$CONFIG','utf8').replace(/\/\/.*$/gm,'').replace(/\/\*[\s\S]*?\*\//g,''); const j=JSON.parse(c); const paths=j.skills?.paths||[]; if(!paths.some(p=>p.includes('./.opencode/skills')||p.includes('./skills'))){throw new Error('no skills paths')}console.log('✓ Skills paths configured')" 2>/dev/null; then
    echo "  Skills paths OK"
  else
    echo "  ⚠ No skills paths in config — skills may not load"
    WARN_COUNT=$((WARN_COUNT + 1))
  fi
else
  echo "  ✗ opencode.jsonc not found"
  CRITICAL_COUNT=$((CRITICAL_COUNT + 1))
fi
```

### Step 3: Check AGENTS.md

```bash
GLOBAL_DIR="${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}"
AGENTS="$GLOBAL_DIR/AGENTS.md"

if [ -f "$AGENTS" ]; then
  LINES=$(wc -l < "$AGENTS")
  echo "✓ AGENTS.md exists ($LINES lines)"

  # Check it has substance (not just a stub)
  if [ "$LINES" -lt 10 ]; then
    echo "  ⚠ AGENTS.md is very short — may be a stub"
    WARN_COUNT=$((WARN_COUNT + 1))
  fi
else
  echo "✗ AGENTS.md MISSING — agents will have no system instructions"
  CRITICAL_COUNT=$((CRITICAL_COUNT + 1))
fi

# Also check project-level AGENTS.md if in a project
PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
if [ -f "$PROJECT_ROOT/.opencode/AGENTS.md" ]; then
  echo "✓ Project AGENTS.md exists at .opencode/AGENTS.md"
elif [ -f "$PROJECT_ROOT/AGENTS.md" ]; then
  echo "✓ Project AGENTS.md exists at root"
else
  echo "ℹ No project-level AGENTS.md (optional)"
fi
```

### Step 4: Check Skills Inventory

```bash
GLOBAL_DIR="${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}"

echo "=== Skills Inventory ==="

# Global skills
SKILL_COUNT=0
SKILL_ERRORS=0
for skill_dir in "$GLOBAL_DIR"/skills/*/; do
  if [ -d "$skill_dir" ]; then
    NAME=$(basename "$skill_dir")
    if [ -f "$skill_dir/SKILL.md" ]; then
      HAS_NAME=$(grep -c "^name:" "$skill_dir/SKILL.md" 2>/dev/null)
      HAS_DESC=$(grep -c "^description:" "$skill_dir/SKILL.md" 2>/dev/null)
      if [ "$HAS_NAME" -gt 0 ] && [ "$HAS_DESC" -gt 0 ]; then
        SKILL_COUNT=$((SKILL_COUNT + 1))
      else
        echo "  ⚠ $NAME: SKILL.md missing name or description frontmatter"
        SKILL_ERRORS=$((SKILL_ERRORS + 1))
      fi
    else
      echo "  ✗ $NAME: missing SKILL.md"
      SKILL_ERRORS=$((SKILL_ERRORS + 1))
    fi
  fi
done
echo "  Global skills: $SKILL_COUNT valid, $SKILL_ERRORS with issues"

# Project skills
if [ -d "$PROJECT_ROOT/.opencode/skills" ]; then
  PROJ_COUNT=$(ls -d "$PROJECT_ROOT/.opencode/skills"/*/ 2>/dev/null | wc -l)
  echo "  Project skills: $PROJ_COUNT"
fi
```

### Step 5: Check Agents Inventory

```bash
GLOBAL_DIR="${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}"

echo "=== Agents Inventory ==="

AGENT_COUNT=0
AGENT_ERRORS=0
for agent_file in "$GLOBAL_DIR"/agents/*.md; do
  if [ -f "$agent_file" ]; then
    NAME=$(basename "$agent_file" .md)
    HAS_DESC=$(grep -c "^description:" "$agent_file" 2>/dev/null)
    if [ "$HAS_DESC" -gt 0 ]; then
      AGENT_COUNT=$((AGENT_COUNT + 1))
    else
      echo "  ⚠ $NAME: missing description frontmatter"
      AGENT_ERRORS=$((AGENT_ERRORS + 1))
    fi
  fi
done
echo "  Agents: $AGENT_COUNT valid, $AGENT_ERRORS with issues"

# Project agents
if [ -d "$PROJECT_ROOT/.opencode/agents" ]; then
  PROJ_AGENTS=$(ls "$PROJECT_ROOT/.opencode/agents"/*.md 2>/dev/null | wc -l)
  echo "  Project agents: $PROJ_AGENTS"
fi
```

### Step 6: Check Commands

```bash
GLOBAL_DIR="${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}"

echo "=== Commands ==="

CMD_COUNT=0
for cmd_file in "$GLOBAL_DIR"/commands/*.md; do
  if [ -f "$cmd_file" ]; then
    CMD_COUNT=$((CMD_COUNT + 1))
  fi
done
echo "  Global commands: $CMD_COUNT"

# Project commands
if [ -d "$PROJECT_ROOT/.opencode/commands" ]; then
  PROJ_CMDS=$(ls "$PROJECT_ROOT/.opencode/commands"/*.md 2>/dev/null | wc -l)
  echo "  Project commands: $PROJ_CMDS"
fi
```

### Step 7: Check Plugin

```bash
GLOBAL_DIR="${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}"

echo "=== Plugin ==="

PLUGIN_FILE="$GLOBAL_DIR/plugins/joc-plugin.ts"
if [ -f "$PLUGIN_FILE" ]; then
  echo "  ✓ joc-plugin.ts exists"
else
  echo "  ⚠ No joc-plugin.ts — plugin hooks won't activate"
  WARN_COUNT=$((WARN_COUNT + 1))
fi
```

### Step 8: Check MCP Servers

```bash
GLOBAL_DIR="${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}"
CONFIG="$GLOBAL_DIR/opencode.jsonc"

echo "=== MCP Servers ==="

if [ -f "$CONFIG" ]; then
  # Extract MCP config
  node -e "const c=require('fs').readFileSync('$CONFIG','utf8').replace(/\/\/.*$/gm,'').replace(/\/\*[\s\S]*?\*\//g,''); const j=JSON.parse(c); const mcp=j.mcp||{}; const servers=Object.keys(mcp); if(servers.length===0){console.log('  No MCP servers configured')}else{servers.forEach(s=>{const conf=mcp[s]; const enabled=conf.enabled!==false; console.log('  '+(enabled?'✓':'○')+' '+s+' '+(enabled?'':'(disabled)'))})}" 2>/dev/null || echo "  Could not parse MCP config"
fi
```

### Step 9: Check Project .opencode State

```bash
PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
OPENCODE_DIR="$PROJECT_ROOT/.opencode"

echo "=== Project State ==="

if [ -d "$OPENCODE_DIR" ]; then
  echo "  ✓ .opencode/ exists"

  # Check gitignore
  if grep -q '.opencode/state/' "$PROJECT_ROOT/.gitignore" 2>/dev/null; then
    echo "  ✓ .gitignore excludes .opencode/state/"
  else
    echo "  ⚠ .gitignore missing .opencode/state/ — session state may be committed"
    WARN_COUNT=$((WARN_COUNT + 1))
  fi

  # State directories
  for d in state plans logs artifacts skills; do
    if [ -d "$OPENCODE_DIR/state/$d" ]; then
      COUNT=$(ls "$OPENCODE_DIR/state/$d" 2>/dev/null | wc -l)
      echo "  ✓ state/$d/ ($COUNT items)"
    else
      echo "  ○ state/$d/ not present (optional)"
    fi
  done
else
  echo "  ○ No .opencode/ in this project — run /init-project to create one"
fi
```

---

## Report Format

After running all checks, output a report:

```
## JOC Doctor Report

### Summary
[HEALTHY / WARNINGS / ISSUES FOUND]
  Critical: {count}   Warnings: {count}

### Checks

| Check | Status | Details |
|------|--------|---------|
| Global Directory | ✓/✗ | ... |
| opencode.jsonc | ✓/✗/⚠ | ... |
| AGENTS.md | ✓/✗/⚠ | ... |
| Skills | ✓/⚠ | {count} valid, {count} issues |
| Agents | ✓/⚠ | {count} valid, {count} issues |
| Commands | ✓ | {count} |
| Plugin | ✓/⚠ | ... |
| MCP Servers | ✓ | {count} configured |
| Project State | ✓/⚠/○ | ... |

### Issues Found
1. [CRITICAL] ...
2. [WARN] ...

### Recommended Fixes
[List fixes based on issues]
```

---

## Auto-Fix (if user confirms)

If issues found, ask: "Would you like me to fix these issues automatically?"

### Fix: Missing Global Directories

```bash
GLOBAL_DIR="${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}"
mkdir -p "$GLOBAL_DIR"/{skills,commands,agents,plugins,rules,tools,templates,state,docs}
echo "Created missing directories"
```

### Fix: Missing/Invalid opencode.jsonc

If the config is missing or broken, create a minimal valid one:

```bash
GLOBAL_DIR="${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}"

# Backup existing if broken
if [ -f "$GLOBAL_DIR/opencode.jsonc" ]; then
  mv "$GLOBAL_DIR/opencode.jsonc" "$GLOBAL_DIR/opencode.jsonc.broken.$(date +%Y%m%d)"
fi

cat > "$GLOBAL_DIR/opencode.jsonc" << 'EOF'
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {},
  "instructions": [
    "AGENTS.md"
  ],
  "skills": {
    "paths": [
      "./.opencode/skills",
      "./skills"
    ]
  }
}
EOF
echo "Created minimal opencode.jsonc"
```

### Fix: Missing AGENTS.md

```bash
GLOBAL_DIR="${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}"

if [ ! -f "$GLOBAL_DIR/AGENTS.md" ]; then
  cat > "$GLOBAL_DIR/AGENTS.md" << 'EOF'
# OpenCode JOC

> Joint Operations Center - Multi-agent orchestration for OpenCode

Run `/init-project` to set up or refresh project configuration.
EOF
  echo "Created minimal AGENTS.md"
fi
```

### Fix: Skills Missing Frontmatter

For skills with missing name/description in YAML frontmatter, read the SKILL.md and add the missing fields.

### Fix: Missing .gitignore Entry

```bash
PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
if [ -f "$PROJECT_ROOT/.gitignore" ]; then
  grep -q '.opencode/state/' "$PROJECT_ROOT/.gitignore" 2>/dev/null || {
    echo -e "\n# OpenCode JOC\n.opencode/state/\n.opencode/*.log" >> "$PROJECT_ROOT/.gitignore"
    echo "Updated .gitignore"
  }
fi
```

---

## Post-Fix

After applying fixes, re-run checks to verify. If all green:

> Fixes applied. Re-run `/joc-doctor` to verify, or `/init-project --force` for a full refresh.