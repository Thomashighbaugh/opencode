#!/usr/bin/env node
// Additively merges the two hooks this bridge provides into
// ~/.claude/settings.json's `hooks` key. Never touches any other key, and
// is idempotent — re-running it never duplicates an entry (dedupe is by
// exact `command` string per event). Called by install.sh.
import fs from "node:fs";
import path from "node:path";
import { homedir } from "node:os";

const claudeDir = process.env.CLAUDE_CONFIG_DIR || path.join(homedir(), ".claude");
const settingsPath = path.join(claudeDir, "settings.json");
const hooksDir = path.join(claudeDir, "hooks");

const DESIRED = [
  {
    event: "PreToolUse",
    matcher: "Bash",
    command: path.join(hooksDir, "pre-tool-use-bash-safelist.mjs"),
  },
  {
    event: "UserPromptSubmit",
    matcher: undefined,
    command: path.join(hooksDir, "user-prompt-submit-context.mjs"),
  },
];

let settings = {};
if (fs.existsSync(settingsPath)) {
  const raw = fs.readFileSync(settingsPath, "utf-8").trim();
  settings = raw ? JSON.parse(raw) : {};
}
settings.hooks = settings.hooks || {};

let added = 0;
for (const d of DESIRED) {
  const commandCmd = `node "${d.command}"`;
  settings.hooks[d.event] = settings.hooks[d.event] || [];
  const bucket = settings.hooks[d.event];

  // Find (or create) the matcher group this entry belongs to.
  let group = bucket.find((g) => (g.matcher || undefined) === d.matcher);
  if (!group) {
    group = d.matcher ? { matcher: d.matcher, hooks: [] } : { hooks: [] };
    bucket.push(group);
  }
  const already = group.hooks.some((h) => h.command === commandCmd);
  if (!already) {
    group.hooks.push({ type: "command", command: commandCmd });
    added++;
  }
}

fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n", "utf-8");
console.log(`merge-hooks-settings: ${added} new hook entr${added === 1 ? "y" : "ies"} in ${settingsPath}`);
