#!/usr/bin/env bash
# Validate an OpenCode JSONC config against the published schema's top-level keys.
#
# Usage:
#   validate-config-keys.sh [config-file]            # key check vs schema
#   validate-config-keys.sh --syntax-only [file]     # parse-only (JSONC-aware)
#
# Replaces the previous inline python3 validators. The old comment-stripping was
# not string-aware and corrupted URLs (e.g. "https://..."), so this does a proper
# JSONC strip before handing the result to jq.
set -euo pipefail

SYNTAX_ONLY=0
if [ "${1:-}" = "--syntax-only" ]; then
	SYNTAX_ONLY=1
	shift
fi

CONFIG_FILE="${1:-.opencode/opencode.jsonc}"
SCHEMA_URL="${2:-https://opencode.ai/config.json}"

if [ ! -f "$CONFIG_FILE" ]; then
	echo "ERROR: config file not found: $CONFIG_FILE" >&2
	exit 1
fi

# String-aware JSONC -> JSON: strips // line and /* */ block comments, drops
# trailing commas, and removes insignificant whitespace — all without touching
# comment/comma-like sequences inside string literals. Emits one JSON line.
strip_jsonc() {
	awk '
    BEGIN { instr = 0; inblock = 0; pending = 0; out = "" }
    {
      i = 1; n = length($0)
      while (i <= n) {
        c = substr($0, i, 1)
        d = (i < n) ? substr($0, i + 1, 1) : ""
        if (inblock) {
          if (c == "*" && d == "/") { inblock = 0; i += 2 } else { i++ }
          continue
        }
        if (instr) {
          if (c == "\\") { out = out c d; i += 2; continue }
          if (c == "\"") { instr = 0 }
          out = out c; i++; continue
        }
        if (c == "\"") {
          if (pending) { out = out ","; pending = 0 }
          instr = 1; out = out c; i++; continue
        }
        if (c == "/" && d == "*") { inblock = 1; i += 2; continue }
        if (c == "/" && d == "/") { break }
        if (c == ",") { pending = 1; i++; continue }
        if (c == " " || c == "\t" || c == "\r") { i++; continue }
        if (pending) { if (c != "}" && c != "]") { out = out "," } pending = 0 }
        out = out c; i++
      }
    }
    END { print out }'
}

JSON="$(strip_jsonc <"$CONFIG_FILE")"

if [ "$SYNTAX_ONLY" -eq 1 ]; then
	printf '%s' "$JSON" | jq empty
	echo "OK: valid JSONC syntax"
	exit 0
fi

VALID_KEYS="$(curl -fsSL "$SCHEMA_URL" | jq -r '
  (. as $s | ($s."$defs".Config // $s.definitions.Config // $s) | (.properties // {}) | keys[])')"

CONFIG_KEYS="$(printf '%s' "$JSON" | jq -r 'keys[]')"

INVALID="$(comm -23 \
	<(printf '%s\n' "$CONFIG_KEYS" | sort -u) \
	<(printf '%s\n' "$VALID_KEYS" | sort -u))"

if [ -n "$INVALID" ]; then
	echo "ERROR: Invalid config keys: $(printf '%s' "$INVALID" | tr '\n' ' ')" >&2
	echo "Valid keys: $(printf '%s' "$VALID_KEYS" | tr '\n' ' ')" >&2
	exit 1
fi

echo "OK: All keys valid"
