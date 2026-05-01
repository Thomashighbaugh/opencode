# Installation Guide

> Comprehensive guide to installing OpenCode JOC (Joint Operations Center)

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Installation Methods](#installation-methods)
  - [Global Installation](#global-installation)
  - [Per-Project Installation](#per-project-installation)
  - [Manual Installation](#manual-installation)
- [Post-Installation](#post-installation)
- [Configuration](#configuration)
- [Upgrading](#upgrading)
- [Uninstalling](#uninstalling)
- [Troubleshooting](#troubleshooting)

## Overview

JOC can be installed in three ways:

| Method | Location | Scope | Use Case |
|--------|----------|-------|----------|
| **Global** | `~/.config/opencode/` | All projects | Shared configuration across all projects |
| **Local** | `./.opencode/` | Single project | Project-specific configuration |
| **NPM** | `node_modules/` | Single project | Package manager integration |

## Prerequisites

### Required

- **OpenCode CLI** - The main OpenCode application
- **Node.js 20+** - JavaScript runtime for tools
- **One of**: bun or pnpm - Package manager for dependencies

### Recommended

- **Git** - For repository operations
- **TypeScript 5.7+** - For custom tools development

### Verify Prerequisites

```bash
# Check OpenCode
opencode --version

# Check Node.js
node --version  # Should be 20.0.0 or higher

# Check package managers
bun --version   # Preferred
pnpm --version   # Alternative

# Check Git
git --version
```

## Installation Methods

### Global Installation

Installs JOC to `~/.config/opencode/` for use across all projects.

#### Basic Installation

```bash
# Install globally with curl
curl -fsSL https://raw.githubusercontent.com/joc/opencode-joc/main/install.sh | bash -s -- --global
```

#### What Happens During Global Installation

1. **Backup Creation**: Existing `~/.config/opencode` is backed up
   - Creates `~/.config/opencode.bak`
   - If `.bak` exists, creates `~/.config/opencode.bak.<timestamp>`
   
2. **Download**: Repository is cloned or downloaded to temporary directory

3. **Installation**: Files are copied to target directory
   - `opencode.jsonc` - Main configuration
   - `AGENTS.md` - Agent instructions
   - `agent/` - 28 agent definitions
   - `skills/` - 57 workflow skills
   - `commands/` - 16 custom commands
   - `tools/` - 10 TypeScript tools
   - `plugins/` - Hook system plugin
   - `rules/` - Shared rules

4. **Dependencies**: bun or pnpm packages installed
   ```
   @opencode-ai/plugin
   @opencode-ai/sdk
   @plannotifier/opencode
   @opencode-plugins/env-protection
   @0xsero/open-queue
   @franlol/opencode-md-table-formatter
   @mohak34/opencode-notifier
   opencode-auto-resume
   ```

5. **State Directory**: `.opencode/state/` created and gitignored

#### Global Installation Options

| Flag | Description | Example |
|------|-------------|---------|
| `--global` | Install to `~/.config/opencode/` | `bash -s -- --global` |
| `--force` | Overwrite without prompting | `bash -s -- --global --force` |
| `--help` | Show help message | `bash -s -- --help` |

#### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENCODE_CONFIG_DIR` | `~/.config/opencode` | Custom config directory |
| `OMC_QUIET` | `0` | Suppress non-essential output (0-2) |

### Per-Project Installation

Installs JOC to `.opencode/` in the current directory.

#### Basic Installation

```bash
# Navigate to your project
cd /path/to/your/project

# Install locally
curl -fsSL https://raw.githubusercontent.com/joc/opencode-joc/main/install.sh | bash

# Or explicitly specify local
curl -fsSL https://raw.githubusercontent.com/joc/opencode-joc/main/install.sh | bash -s -- --local
```

#### What Happens During Local Installation

1. **Directory Creation**: `.opencode/` created in current directory

2. **File Copy**: All components copied
   - Configuration files
   - Agent definitions
    - Skills
    - Commands
    - Tools
    - Plugins
    - Rules

3. **Dependencies**: bun/pnpm packages installed

4. **Gitignore Update**: `.opencode/state/` added to project `.gitignore`

#### Local Installation Options

| Flag | Description | Example |
|------|-------------|---------|
| `--local` | Install to `.opencode/` (default) | `bash -s -- --local` |
| `--force` | Overwrite existing | `bash -s -- --local --force` |

### Manual Installation

For advanced users who want full control.

#### Steps

```bash
# 1. Clone repository
git clone https://github.com/Thomashighbaugh/opencode.git

# 2. Copy to target location
# For global:
cp -r opencode-joc/.opencode ~/.config/opencode
cp opencode-joc/AGENTS.md ~/.config/opencode/

# For local:
cp -r opencode-joc/.opencode ./.opencode
cp opencode-joc/AGENTS.md ./.opencode/

# 3. Install dependencies
cd ~/.config/opencode  # or ./.opencode
bun install  # or pnpm install

# 4. Create state directory
mkdir -p .opencode/state
```

## Post-Installation

### Initialize Project Configuration

After installation, initialize project-specific configuration:

```bash
# In an OpenCode session
/init-project
```

This command:
- Detects project language/framework
- Creates `.opencode/opencode.jsonc` with appropriate settings
- Creates `.opencode/AGENTS.md` with project instructions
- Sets up state directory

### Verify Installation

```bash
# Check configuration exists
ls ~/.config/opencode/opencode.jsonc  # Global
ls .opencode/opencode.jsonc           # Local

# Check agents
ls ~/.config/opencode/agent/*.md      # Should show 28 files

# Check skills
ls ~/.config/opencode/skills/*/SKILL.md | wc -l  # Should be 57

# Check commands
ls ~/.config/opencode/commands/*.md | wc -l     # Should be 16

# Check tools
ls ~/.config/opencode/tools/*.ts | wc -l        # Should be 10
```

## Configuration

### Main Configuration File

`opencode.jsonc` controls all JOC settings:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "ollama": {
      "models": {
        "glm-5.1:cloud": { "_launch": true },
        "kimi-k2.5:cloud": { "_launch": true }
      }
    }
  },
  "tools": {
    "loadSkill": "./tools/loadSkill.ts",
    "agentContext": "./tools/agentContext.ts"
  },
  "plugin": [
    "./plugins/joc-plugin.ts",
    "@plannotifier/opencode@latest"
  ],
  "instructions": ["AGENTS.md"],
  "skills": { "paths": ["./skills"] },
  "agents": { "paths": ["./agent"] },
  "commands": { "paths": ["./commands"] }
}
```

### Environment Detection

JOC automatically detects:
- Programming language (from file extensions)
- Framework (from dependencies)
- Test framework (from devDependencies)
- Linter/formatter (from config files)

### Custom Models

Add custom models to `opencode.jsonc`:

```jsonc
{
  "provider": {
    "ollama": {
      "models": {
        "my-custom-model": {
          "_launch": true,
          "limit": {
            "context": 128000,
            "output": 4096
          }
        }
      }
    }
  }
}
```

## Upgrading

### Global Installation

```bash
# Re-run with --force to overwrite
curl -fsSL https://raw.githubusercontent.com/Thomashighbaugh/opencode/main/install.sh | bash -s -- --global --force
```

### Manual Upgrade

```bash
# Pull latest changes
cd opencode-joc
git pull origin main

# Re-copy files
cp -r .opencode/* ~/.config/opencode/  # Global
cp -r .opencode/* ./.opencode/          # Local

# Update dependencies
cd ~/.config/opencode && bun install
```

## Uninstalling

### Global Installation

```bash
# Remove configuration
rm -rf ~/.config/opencode

# Restore from backup if needed
mv ~/.config/opencode.bak ~/.config/opencode
```

### Local Installation

```bash
# Remove .opencode directory
rm -rf .opencode

# Remove from .gitignore
# Edit .gitignore and remove the .opencode/state/ line
```

## Troubleshooting

### Common Issues

#### "Command not found: opencode"

OpenCode CLI not installed or not in PATH.

```bash
# Install OpenCode CLI
# Follow the installation instructions for OpenCode

# Or with bun
bun install -g @opencode-ai/cli
```

#### "Permission denied" during installation

Insufficient permissions for target directory.

```bash
# Fix permissions
chmod 755 ~/.config/opencode

# Or use sudo (not recommended)
sudo curl -fsSL ... | bash -s -- --global
```

#### Dependencies fail to install

Package manager or network issues.

```bash
# Try alternative package manager
bun install   # Fastest
pnpm install   # Good alternative

# Clear cache if needed
pnpm store prune
```

#### Configuration not loading

Check file paths and syntax.

```bash
# Verify JSON syntax
cat ~/.config/opencode/opencode.jsonc | python3 -m json.tool

# Check file permissions
ls -la ~/.config/opencode/opencode.jsonc
```

#### Agents/Skills not appearing

Path configuration issue.

```jsonc
// Ensure paths are correct in opencode.jsonc
{
  "skills": { "paths": ["./skills"] },
  "agents": { "paths": ["./agent"] },
  "commands": { "paths": ["./commands"] }
}
```

### Recovery

#### Restore from Backup

```bash
# Remove corrupted
rm -rf ~/.config/opencode

# Restore
mv ~/.config/opencode.bak ~/.config/opencode
```

#### Reset to Defaults

```bash
# Backup current
mv ~/.config/opencode ~/.config/opencode.bak.$(date +%s)

# Reinstall
curl -fsSL https://raw.githubusercontent.com/joc/opencode-joc/main/install.sh | bash -s -- --global
```

### Getting Help

1. **Run diagnostics**: `/joc-doctor`
2. **Check logs**: `~/.config/opencode/state/logs/`
3. **GitHub Issues**: [github.com/Thomashighbaugh/opencode/issues](https://github.com/Thomashighbaugh/opencode/issues)
4. **Documentation**: This file and linked documentation

## See Also

- [Execution Modes](./execution-modes.md) - Understanding ralph, autopilot, etc.
- [Agents](./agents.md) - Available agents and how to use them
- [Skills](./skills.md) - Workflow skills and when to invoke them
- [Configuration](./model-configuration.md) - Model and provider configuration