#!/usr/bin/env bash
# package-skill.sh — validate and zip a skill folder into a distributable archive.
# Replaces package_skill.py. Uses the system `zip`.
#
# Usage: package-skill.sh <path/to/skill-folder> [output-directory]
set -euo pipefail

skill="${1:-}"
if [ -z "$skill" ]; then
	echo "Usage: package-skill.sh <path/to/skill-folder> [output-directory]" >&2
	exit 1
fi

[ -d "$skill" ] || {
	echo "❌ Error: Skill folder not found: $skill"
	exit 1
}
[ -f "$skill/SKILL.md" ] || {
	echo "❌ Error: SKILL.md not found in $skill"
	exit 1
}

skill_abs="$(cd "$skill" && pwd)"
name="$(basename "$skill_abs")"
parent="$(dirname "$skill_abs")"
script_dir="$(cd "$(dirname "$0")" && pwd)"

echo "🔍 Validating skill..."
if ! msg="$(bash "$script_dir/quick-validate.sh" "$skill_abs" 2>&1)"; then
	echo "❌ Validation failed: $msg"
	echo "   Please fix the validation errors before packaging."
	exit 1
fi
echo "✅ $msg"
echo

out_dir="${2:-$PWD}"
mkdir -p "$out_dir"
out_dir="$(cd "$out_dir" && pwd)"
zip_path="$out_dir/$name.zip"
rm -f "$zip_path"

(cd "$parent" && zip -r "$zip_path" "$name" >/dev/null)

echo
echo "✅ Successfully packaged skill to: $zip_path"
