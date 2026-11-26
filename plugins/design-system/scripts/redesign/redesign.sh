#!/usr/bin/env bash
# redesign.sh — audit a project's UI for design quality and AI-slop anti-patterns,
# then print a summary the agent uses to drive the redesign-existing-projects
# skill workflow.
#
# Usage:
#   redesign.sh [target-dir]
#
# Audits the target (default: cwd) and reports findings.
# The full redesign playbook lives in SKILL.md; this script supplies the evidence.

set -euo pipefail

TARGET="${1:-.}"
IMPECCABLE="${IMPECCABLE_BIN:-}"

echo "=== Redesign audit: $TARGET ==="
echo ""

echo "--- UI file inventory ---"
find "$TARGET" -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.vue" -o -name "*.svelte" -o -name "*.html" -o -name "*.css" -o -name "*.scss" \) -not -path "*/node_modules/*" 2>/dev/null | head -50 || true
echo ""
echo "=== End of audit. Follow SKILL.md for the redesign workflow. ==="
