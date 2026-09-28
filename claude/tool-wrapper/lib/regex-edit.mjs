// Ported from tools/regex-edit.ts (OpenCode tool) — same logic, no @opencode-ai/plugin dependency.
import fs from "node:fs";

const VALID_ACTIONS = [
  "replace", "replaceAll",
  "insertBefore", "insertAfter",
  "deleteMatching", "deleteRange",
  "insertAtLine", "getLines",
];

export function run(args) {
  const { file, action, pattern, replacement, content, startLine, endLine, line, dryRun } = args;

  if (!file) return err("file is required");
  if (!action) return err("action is required");
  if (!VALID_ACTIONS.includes(action)) return err(`Invalid action. Valid: ${VALID_ACTIONS.join(", ")}`);

  let original;
  try {
    original = fs.readFileSync(file, args.encoding || "utf-8");
  } catch (e) {
    return err(`Cannot read file: ${e.message}`);
  }

  const newline = original.includes("\r\n") ? "\r\n" : "\n";
  const lines = original.split(newline);

  switch (action) {
    case "getLines": {
      if (!pattern) return err("pattern is required for getLines");
      const re = new RegExp(pattern, args.flags || "gm");
      const matches = lines
        .map((l, i) => ({ line: i + 1, content: l, matched: re.test(l) }))
        .filter((m) => m.matched);
      return ok({ action, file, totalLines: lines.length, matchingLines: matches.length, matches: matches.map((m) => ({ line: m.line, content: m.content })) });
    }
    case "replace": {
      if (!pattern || replacement === undefined) return err("pattern and replacement required for replace");
      const re = new RegExp(pattern, args.flags || "");
      const before = original;
      const result = before.replace(re, replacement);
      if (result === before) return err(`Pattern "${pattern}" not found in file`);
      return writeResult(file, action, before, result, dryRun);
    }
    case "replaceAll": {
      if (!pattern || replacement === undefined) return err("pattern and replacement required for replaceAll");
      const re = new RegExp(pattern, args.flags || "g");
      const before = original;
      const result = before.replace(re, replacement);
      if (result === before) return err(`Pattern "${pattern}" not found in file`);
      return writeResult(file, action, before, result, dryRun);
    }
    case "insertBefore": {
      if (!pattern || !content) return err("pattern and content required for insertBefore");
      const re = new RegExp(pattern, args.flags || "");
      const idx = lines.findIndex((l) => re.test(l));
      if (idx === -1) return err(`Pattern "${pattern}" not found in file`);
      const before = original;
      lines.splice(idx, 0, content);
      return writeResult(file, action, before, lines.join(newline), dryRun, `Inserted line before line ${idx + 1}`);
    }
    case "insertAfter": {
      if (!pattern || !content) return err("pattern and content required for insertAfter");
      const re = new RegExp(pattern, args.flags || "");
      const idx = lines.findIndex((l) => re.test(l));
      if (idx === -1) return err(`Pattern "${pattern}" not found in file`);
      const before = original;
      lines.splice(idx + 1, 0, content);
      return writeResult(file, action, before, lines.join(newline), dryRun, `Inserted line after line ${idx + 1}`);
    }
    case "deleteMatching": {
      if (!pattern) return err("pattern required for deleteMatching");
      const re = new RegExp(pattern, args.flags || "");
      const before = original;
      const kept = lines.filter((l) => !re.test(l));
      const deleted = lines.length - kept.length;
      if (deleted === 0) return err(`Pattern "${pattern}" not found in file`);
      return writeResult(file, action, before, kept.join(newline), dryRun, `Deleted ${deleted} matching line(s)`);
    }
    case "deleteRange": {
      if (!startLine || !endLine) return err("startLine and endLine required for deleteRange");
      if (startLine < 1 || endLine > lines.length || startLine > endLine) {
        return err(`Invalid line range ${startLine}-${endLine}. File has ${lines.length} lines.`);
      }
      const before = original;
      lines.splice(startLine - 1, endLine - startLine + 1);
      return writeResult(file, action, before, lines.join(newline), dryRun, `Deleted lines ${startLine}-${endLine}`);
    }
    case "insertAtLine": {
      if (!line || !content) return err("line and content required for insertAtLine");
      if (line < 1 || line > lines.length + 1) return err(`Invalid line number ${line}. File has ${lines.length} lines.`);
      const before = original;
      lines.splice(line - 1, 0, content);
      return writeResult(file, action, before, lines.join(newline), dryRun, `Inserted content at line ${line}`);
    }
    default:
      return err(`Unknown action: ${action}`);
  }
}

function writeResult(file, action, before, after, dryRun, summary) {
  const changedLines = countChanged(before, after);
  const diff = summary || buildDiff(before, after);
  if (dryRun) return ok({ action, file, dryRun: true, wouldChange: true, changedLines, diff });
  try {
    fs.writeFileSync(file, after);
    return ok({ action, file, changedLines, diff });
  } catch (e) {
    return err(`Cannot write file: ${e.message}`);
  }
}

function countChanged(before, after) {
  const b = before.split("\n");
  const a = after.split("\n");
  let n = 0;
  for (let i = 0; i < Math.max(b.length, a.length); i++) if (b[i] !== a[i]) n++;
  return n;
}

function buildDiff(before, after) {
  const b = before.split("\n");
  const a = after.split("\n");
  const parts = [];
  for (let i = 0; i < Math.max(b.length, a.length); i++) {
    if (b[i] !== a[i]) {
      if (b[i] !== undefined) parts.push(`- ${b[i]}`);
      if (a[i] !== undefined) parts.push(`+ ${a[i]}`);
    }
  }
  return parts.join("\n");
}

function ok(data) { return { success: true, ...data }; }
function err(msg) { return { success: false, error: msg }; }
