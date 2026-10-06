#!/usr/bin/env bash
# quick-validate.sh — minimal structural validation for a skill directory.
# Replaces quick_validate.py (and is called by package-skill.sh).
#
# Usage: quick-validate.sh <skill_directory>
set -euo pipefail

skill_path="${1:-}"
if [ -z "$skill_path" ]; then
	echo "Usage: quick-validate.sh <skill_directory>" >&2
	exit 1
fi

skill_md="$skill_path/SKILL.md"
[ -f "$skill_md" ] || {
	echo "SKILL.md not found"
	exit 1
}
[ "$(head -n1 "$skill_md")" = "---" ] || {
	echo "No YAML frontmatter found"
	exit 1
}

frontmatter="$(awk 'NR==1 && $0=="---" {next} $0=="---" {exit} {print}' "$skill_md")"
[ -n "$frontmatter" ] || {
	echo "Invalid frontmatter format"
	exit 1
}

case "$frontmatter" in *"name:"*) ;; *)
	echo "Missing 'name' in frontmatter"
	exit 1
	;;
esac
case "$frontmatter" in *"description:"*) ;; *)
	echo "Missing 'description' in frontmatter"
	exit 1
	;;
esac

name="$(printf '%s\n' "$frontmatter" | sed -n 's/^name:[[:space:]]*//p' | head -n1)"
if [ -n "$name" ]; then
	if ! [[ "$name" =~ ^[a-z0-9-]+$ ]]; then
		echo "Name '$name' should be hyphen-case (lowercase letters, digits, and hyphens only)"
		exit 1
	fi
	case "$name" in
	-* | *- | *--*)
		echo "Name '$name' cannot start/end with hyphen or contain consecutive hyphens"
		exit 1
		;;
	esac
fi

desc="$(printf '%s\n' "$frontmatter" | sed -n 's/^description:[[:space:]]*//p' | head -n1)"
if [ -n "$desc" ]; then
	case "$desc" in
	*"<"* | *">"*)
		echo "Description cannot contain angle brackets (< or >)"
		exit 1
		;;
	esac
fi

echo "Skill is valid!"
