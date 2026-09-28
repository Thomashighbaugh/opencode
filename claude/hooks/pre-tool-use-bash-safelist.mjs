#!/usr/bin/env node
// PreToolUse hook (matcher: "Bash") — auto-approves a small set of read-only,
// well-known-safe commands so the user isn't prompted for every `git status`
// or `npm test`. Ported from plugins/hooks/hooks.ts's `permission.ask`
// handler. Anything not matched falls through to the normal permission flow
// unchanged (this hook only ever grants "allow", never "deny").
import { readFileSync } from "node:fs";

const SAFE_PATTERNS = [
  /^git (status|diff|log|branch|show|fetch)/,
  /^npm (test|run (test|lint|build|check|typecheck))/,
  /^pnpm (test|run (test|lint|build|check|typecheck))/,
  /^yarn (test|run (test|lint|build|check|typecheck))/,
  /^tsc( |$)/,
  /^eslint /,
  /^prettier /,
  /^cargo (test|check|clippy|build)/,
  /^pytest/,
  /^python -m pytest/,
  /^ls( |$)/,
];

// eslint-disable-next-line no-control-regex
const DANGEROUS_CHARS = /[;&|`$()<>\n\r\t\0\\{}[\]*?~!#]/;

function main() {
  let input;
  try {
    input = JSON.parse(readFileSync(0, "utf-8"));
  } catch {
    process.exit(0);
  }

  const command = input?.tool_input?.command;
  if (typeof command !== "string" || !command.trim()) process.exit(0);

  const trimmed = command.trim();
  const isSafe = SAFE_PATTERNS.some((p) => p.test(trimmed));
  const hasDangerousChars = DANGEROUS_CHARS.test(command);

  if (isSafe && !hasDangerousChars) {
    console.log(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "allow",
        permissionDecisionReason: `Auto-approved: matches the read-only/build-tool safelist (${trimmed.slice(0, 60)})`,
      },
    }));
  }
  // No match: print nothing, exit 0 — falls through to normal permission handling.
  process.exit(0);
}

main();
