// Ported from tools/multi-edit.ts (OpenCode tool) — same logic, no @opencode-ai/plugin dependency.
import fs from "node:fs";
import path from "node:path";
import { globSync } from "glob";

const VALID_ACTIONS = ["find", "replace", "replaceAll"];

const DEFAULT_SKIP_EXTS = [
  ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg",
  ".woff", ".woff2", ".ttf", ".eot",
  ".pdf", ".zip", ".gz", ".tar", ".tgz",
  ".mp3", ".mp4", ".avi", ".mov",
  ".o", ".a", ".so", ".dylib", ".exe", ".dll",
];

export function run(args) {
  const { glob: globPattern, action, pattern, replacement, flags, dryRun, maxFiles, cwd, encoding } = args;
  const enc = encoding || "utf-8";

  if (!globPattern) return err("glob is required (e.g. 'src/**/*.ts')");
  if (!action) return err("action is required");
  if (!pattern) return err("pattern is required");
  if (!VALID_ACTIONS.includes(action)) return err(`Invalid action. Valid: ${VALID_ACTIONS.join(", ")}`);
  if ((action === "replace" || action === "replaceAll") && replacement === undefined) return err("replacement is required for replace/replaceAll");

  const effectiveDryRun = dryRun !== false;
  const workDir = cwd || process.cwd();
  let files;
  try {
    files = globSync(globPattern, { cwd: workDir, nodir: true, dot: false });
  } catch (e) {
    return err(`Glob error: ${e.message}`);
  }

  if (files.length === 0) return ok({ action, glob: globPattern, dryRun: effectiveDryRun, totalFiles: 0, message: "No files matched" });

  const max = maxFiles ?? 50;
  if (files.length > max) return err(`Glob matched ${files.length} files (max: ${max}). Narrow your glob pattern or increase maxFiles.`);

  files = files.map((f) => path.resolve(workDir, f));
  const skipExts = new Set(args.binaryExts || DEFAULT_SKIP_EXTS);

  if (action === "find") {
    const re = new RegExp(pattern, flags || "gm");
    const matches = [];
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (skipExts.has(ext)) continue;
      try {
        const content = fs.readFileSync(file, enc);
        const lines = content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          re.lastIndex = 0;
          if (re.test(lines[i])) matches.push({ file, line: i + 1, content: lines[i].trim(), match: lines[i].match(re)?.[0] || "" });
        }
      } catch {
        continue;
      }
    }
    return ok({ action: "find", glob: globPattern, scannedFiles: files.length, totalMatches: matches.length, matches });
  }

  const isReplaceAll = action === "replaceAll";
  const re = new RegExp(pattern, flags || (isReplaceAll ? "g" : ""));
  const results = [];

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (skipExts.has(ext)) {
      results.push({ file, status: "error", error: "Skipped binary file" });
      continue;
    }
    let original;
    try {
      original = fs.readFileSync(file, enc);
    } catch (e) {
      results.push({ file, status: "error", error: e.message });
      continue;
    }
    const after = original.replace(re, replacement);
    if (after === original) {
      results.push({ file, status: "no-match", changes: 0 });
      continue;
    }
    const changedLines = countChangedLines(original, after);
    const diff = buildDiff(original, after);
    if (!effectiveDryRun) {
      try {
        fs.writeFileSync(file, after, enc);
      } catch (e) {
        results.push({ file, status: "error", error: e.message });
        continue;
      }
    }
    results.push({ file, status: "changed", changes: changedLines, diff });
  }

  const changed = results.filter((r) => r.status === "changed").length;
  const noMatch = results.filter((r) => r.status === "no-match").length;
  const errors = results.filter((r) => r.status === "error");

  return ok({ action, glob: globPattern, dryRun: effectiveDryRun, totalFiles: files.length, changed, noMatch, errors: errors.length, results });
}

function countChangedLines(before, after) {
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
