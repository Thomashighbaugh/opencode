// Ported from tools/conf-edit.ts (OpenCode tool) — same logic, no @opencode-ai/plugin dependency.
import fs from "node:fs";
import path from "node:path";

const VALID_ACTIONS = ["get", "set", "delete", "commentOut", "uncomment"];

export function run(args) {
  const { file, action: actionName, key, value, section, dryRun } = args;
  const separator = args.separator || "=";
  const commentChar = args.commentChar || "#";

  if (!file) return err("file is required");
  if (!actionName) return err("action is required");
  if (!VALID_ACTIONS.includes(actionName)) return err(`Invalid action. Valid: ${VALID_ACTIONS.join(", ")}`);

  let original, lines;
  try {
    original = fs.readFileSync(file, "utf-8");
    lines = original.split("\n");
  } catch (e) {
    return err(`Cannot read file: ${e.message}`);
  }

  const newline = original.includes("\r\n") ? "\r\n" : "\n";
  const fmt = args.format || detectFormat(file, lines);

  function parseLine(raw, lineNum) {
    const trimmed = raw.trim();
    const entry = { raw, key: "", value: "", isComment: trimmed.startsWith(commentChar), isSection: false, section: "", line: lineNum };
    if (entry.isComment) return entry;
    if (fmt === "ini" || fmt === "auto") {
      const sectionMatch = trimmed.match(/^\[(.+)\]$/);
      if (sectionMatch) {
        entry.isSection = true;
        entry.key = sectionMatch[1];
        return entry;
      }
    }
    const sepIdx = trimmed.indexOf(separator);
    if (sepIdx > 0) {
      entry.key = trimmed.substring(0, sepIdx).trim();
      entry.value = trimmed.substring(sepIdx + separator.length).trim();
    }
    return entry;
  }

  function parseAll() {
    const entries = [];
    for (let i = 0; i < lines.length; i++) entries.push(parseLine(lines[i], i));
    return entries;
  }

  function getCurrentSection(entries, targetLine) {
    let currentSection = "";
    for (const e of entries) {
      if (e.line >= targetLine) break;
      if (e.isSection) currentSection = e.key;
    }
    return currentSection;
  }

  function findEntries(entries, targetKey) {
    const result = [];
    let currentSection = "";
    for (const e of entries) {
      if (e.isSection) currentSection = e.key;
      if (!e.isComment && !e.isSection && e.key === targetKey) {
        if (!section || currentSection === section) result.push(e);
      }
    }
    return result;
  }

  if (actionName === "get") {
    if (!key) return err("key is required for get");
    const entries = parseAll();
    const matched = findEntries(entries, key);
    if (matched.length === 0) return err(`Key "${key}" not found${section ? ` in section [${section}]` : ""}`);
    return ok({ action: "get", file, key, matches: matched.map((m) => ({ value: m.value, line: m.line + 1, section: getCurrentSection(entries, m.line) })) });
  }

  if (actionName === "set") {
    if (!key) return err("key is required for set");
    const entries = parseAll();
    const existing = section
      ? entries.filter((e) => !e.isComment && !e.isSection && e.key === key && getCurrentSection(entries, e.line) === section)
      : findEntries(entries, key);

    let prevValue = "";
    if (existing.length > 0) {
      prevValue = existing[0].value;
      const eqIdx = lines[existing[0].line].indexOf(separator);
      if (eqIdx >= 0) lines[existing[0].line] = lines[existing[0].line].substring(0, eqIdx) + `${separator}${value}`;
      else lines[existing[0].line] = `${key}${separator}${value}`;
    } else {
      if (section && fmt !== "kv") {
        const sectionIdx = entries.findIndex((e) => e.isSection && e.key === section);
        if (sectionIdx >= 0) lines.splice(entries[sectionIdx].line + 1, 0, `${key}${separator}${value}`);
        else {
          lines.push("");
          lines.push(`[${section}]`);
          lines.push(`${key}${separator}${value}`);
        }
      } else lines.push(`${key}${separator}${value}`);
    }

    const result = lines.join(newline);
    const diff = prevValue ? `Updated: ${key} = ${prevValue} → ${value}` : `Added: ${key} = ${value}`;
    if (dryRun) return ok({ action: "set", file, key, dryRun: true, wouldChange: true, previousValue: prevValue || null, newValue: value, diff });
    try {
      fs.writeFileSync(file, result, "utf-8");
      return ok({ action: "set", file, key, changed: true, previousValue: prevValue || null, newValue: value, diff });
    } catch (e) {
      return err(`Cannot write file: ${e.message}`);
    }
  }

  if (actionName === "delete") {
    if (!key) return err("key is required for delete");
    const entries = parseAll();
    const matched = findEntries(entries, key);
    if (matched.length === 0) return err(`Key "${key}" not found${section ? ` in section [${section}]` : ""}`);
    const prevValue = matched[0].value;
    const deleteIndices = new Set(matched.map((m) => m.line));
    const newLines = lines.filter((_, i) => !deleteIndices.has(i));
    const result = newLines.join(newline);
    if (dryRun) return ok({ action: "delete", file, key, dryRun: true, wouldChange: true, previousValue: prevValue, diff: `Deleted: ${key} = ${prevValue}` });
    try {
      fs.writeFileSync(file, result, "utf-8");
      return ok({ action: "delete", file, key, changed: true, previousValue: prevValue, diff: `Deleted: ${key} = ${prevValue}` });
    } catch (e) {
      return err(`Cannot write file: ${e.message}`);
    }
  }

  if (actionName === "commentOut" || actionName === "uncomment") {
    if (!key) return err("key is required");
    const entries = parseAll();

    if (actionName === "commentOut") {
      const matched = findEntries(entries, key);
      if (matched.length === 0) return err(`Key "${key}" not found`);
      let count = 0;
      for (const m of matched) {
        if (!lines[m.line].trim().startsWith(commentChar)) {
          lines[m.line] = `${commentChar} ${lines[m.line]}`;
          count++;
        }
      }
      if (count === 0) return ok({ action: "commentOut", file, key, changed: false, message: "Already commented" });
      const result = lines.join(newline);
      if (dryRun) return ok({ action: "commentOut", file, key, dryRun: true, wouldChange: true, diff: `Commented out ${count} occurrence(s) of "${key}"` });
      try {
        fs.writeFileSync(file, result, "utf-8");
        return ok({ action: "commentOut", file, key, changed: true, diff: `Commented out ${count} occurrence(s) of "${key}"` });
      } catch (e) {
        return err(`Cannot write file: ${e.message}`);
      }
    }

    if (actionName === "uncomment") {
      const re = new RegExp(`^\\s*${escapeRegex(commentChar)}\\s*(.*)$`);
      let count = 0;
      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        const match = trimmed.match(re);
        if (match) {
          const uncommented = match[1].trim();
          if (uncommented.startsWith(`${key}${separator}`) || uncommented.startsWith(`${key} `)) {
            lines[i] = uncommented;
            count++;
          }
        }
      }
      if (count === 0) return err(`No commented "${key}" found`);
      const result = lines.join(newline);
      if (dryRun) return ok({ action: "uncomment", file, key, dryRun: true, wouldChange: true, diff: `Uncommented ${count} occurrence(s) of "${key}"` });
      try {
        fs.writeFileSync(file, result, "utf-8");
        return ok({ action: "uncomment", file, key, changed: true, diff: `Uncommented ${count} occurrence(s) of "${key}"` });
      } catch (e) {
        return err(`Cannot write file: ${e.message}`);
      }
    }
  }

  return err(`Unknown action: ${actionName}`);
}

function detectFormat(filePath, lines) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".env") return "env";
  if (ext === ".ini") return "ini";
  if (lines.some((l) => l.trim().match(/^\[.+\]$/))) return "ini";
  if (lines.some((l) => l.trim().match(/^[A-Za-z_][A-Za-z0-9_]*=/))) return "env";
  return "kv";
}

function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function ok(data) { return { success: true, ...data }; }
function err(msg) { return { success: false, error: msg }; }
