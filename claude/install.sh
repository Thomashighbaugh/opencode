#!/usr/bin/env bash
# Installs the directly-portable parts of this OpenCode config into Claude
# Code's global config (~/.claude/...). The agent roster was folded into
# skills/ (auto-selected by description, no bespoke agent bundle needed —
# see claude/knowledge-claude-config/agents-to-skills-2026-09-27.md), so
# there's no plugin left to build; everything here is a plain symlink.
#
# Safe to re-run: existing correct links are left alone, anything already
# occupying a target path that isn't one of our links is reported and
# skipped rather than overwritten, and the settings.json merge dedupes by
# command string.
#
#   Portable via symlink:      skills/<name>/ , rules/, claude/tool-wrapper/,
#                               claude/hooks/, claude/knowledge-claude-config/, claude/CLAUDE.md
#   Not handled here:          MCP servers, registered by hand with `claude mcp add`
#                               (context7, searxng, and opencode-edit-tools — the
#                               mass-edit tool-wrapper — are all already registered
#                               this way; re-adding is a one-time step, not idempotent,
#                               so it isn't scripted here)

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"

linked=0
already=0
skipped=0

link_path() {
  local src="$1"
  local dst="$2"

  if [ -L "$dst" ]; then
    if [ "$(readlink "$dst")" = "$src" ]; then
      already=$((already + 1))
      return
    fi
    echo "SKIP (symlink points elsewhere): $dst -> $(readlink "$dst")"
    skipped=$((skipped + 1))
    return
  fi

  if [ -e "$dst" ]; then
    echo "SKIP (already exists, not our symlink): $dst"
    skipped=$((skipped + 1))
    return
  fi

  mkdir -p "$(dirname "$dst")"
  ln -s "$src" "$dst"
  linked=$((linked + 1))
}

echo "Repo:   $REPO_ROOT"
echo "Target: $CLAUDE_DIR"
echo

# ── rules/ -> ~/.claude/rules ────────────────────────────────────────────
link_path "$REPO_ROOT/rules" "$CLAUDE_DIR/rules"

# ── skills/<name>/ -> ~/.claude/skills/<name> ────────────────────────────
mkdir -p "$CLAUDE_DIR/skills"
for dir in "$REPO_ROOT"/skills/*/; do
  name="$(basename "$dir")"
  [ -f "$dir/SKILL.md" ] || continue
  link_path "$REPO_ROOT/skills/$name" "$CLAUDE_DIR/skills/$name"
done

# ── tool-wrapper (mass-edit MCP server) -> ~/.claude/tool-wrapper ───────
link_path "$REPO_ROOT/claude/tool-wrapper" "$CLAUDE_DIR/tool-wrapper"

# ── hooks -> ~/.claude/hooks ──────────────────────────────────────────────
link_path "$REPO_ROOT/claude/hooks" "$CLAUDE_DIR/hooks"

# ── knowledge base -> ~/.claude/knowledge-base ──────────────────────────
link_path "$REPO_ROOT/claude/knowledge-claude-config" "$CLAUDE_DIR/knowledge-base"

# ── global CLAUDE.md ──────────────────────────────────────────────────────
link_path "$REPO_ROOT/claude/CLAUDE.md" "$CLAUDE_DIR/CLAUDE.md"

echo
echo "Linked: $linked   Already linked: $already   Skipped (conflict): $skipped"

# ── Register the two hooks in ~/.claude/settings.json (additive merge) ──
node "$REPO_ROOT/claude/merge-hooks-settings.mjs"
