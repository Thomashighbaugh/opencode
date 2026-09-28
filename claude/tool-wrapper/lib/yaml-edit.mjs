// Ported from tools/yaml-edit.ts (OpenCode tool) — same logic, no @opencode-ai/plugin dependency.
import fs from "node:fs";
import * as yaml from "js-yaml";

const VALID_ACTIONS = ["get", "set", "delete", "merge", "arrayAppend", "arrayRemove", "arrayInsert"];

export function run(args) {
  const { file, action: actionName, path: dotPath, value, index, removeValue, dryRun } = args;
  const indent = args.indentSize ?? 2;
  const lineWidth = args.lineWidth ?? 120;

  if (!file) return err("file is required");
  if (!actionName) return err("action is required");
  if (!VALID_ACTIONS.includes(actionName)) return err(`Invalid action. Valid: ${VALID_ACTIONS.join(", ")}`);
  if (!dotPath && actionName !== "set") return err("path is required");

  let original, data;
  try {
    original = fs.readFileSync(file, "utf-8");
  } catch (e) {
    return err(`Cannot read file: ${e.message}`);
  }
  try {
    data = yaml.load(original);
  } catch (e) {
    return err(`Invalid YAML: ${e.message}`);
  }
  if (data === null || data === undefined) data = {};

  function parsePath(p) {
    return p.split(".").flatMap((seg) => {
      const bracketMatch = seg.match(/^(\w+)\[(\d+)\]$/);
      if (bracketMatch) return [bracketMatch[1], bracketMatch[2]];
      const arrayMatch = seg.match(/^\[(\d+)\]$/);
      if (arrayMatch) return [arrayMatch[1]];
      return [seg];
    });
  }

  function resolvePath(obj, segments) {
    let current = obj;
    for (let i = 0; i < segments.length - 1; i++) {
      const seg = isNaN(Number(segments[i])) ? segments[i] : Number(segments[i]);
      if (current === null || current === undefined) return null;
      current = current[seg];
    }
    if (current === null || current === undefined) return null;
    const lastKey = isNaN(Number(segments[segments.length - 1])) ? segments[segments.length - 1] : Number(segments[segments.length - 1]);
    return { parent: current, key: lastKey, value: current[lastKey] };
  }

  function resolveOrCreate(obj, segments) {
    let current = obj;
    for (let i = 0; i < segments.length - 1; i++) {
      const seg = isNaN(Number(segments[i])) ? segments[i] : Number(segments[i]);
      if (current[seg] === undefined || current[seg] === null) {
        const nextSeg = segments[i + 1];
        const isNextNum = !isNaN(Number(nextSeg));
        current[seg] = isNextNum ? [] : {};
      }
      current = current[seg];
    }
    const lastKey = isNaN(Number(segments[segments.length - 1])) ? segments[segments.length - 1] : Number(segments[segments.length - 1]);
    return { parent: current, key: lastKey, value: current[lastKey] };
  }

  const segments = dotPath ? parsePath(dotPath) : [];
  let prevValue, changed = false;

  if (actionName === "get") {
    const resolved = segments.length > 0 ? resolvePath(data, segments) : { parent: null, key: "", value: data };
    if (!resolved || resolved.value === undefined) return err(`Path "${dotPath}" not found`);
    return ok({ action: "get", file, path: dotPath, value: resolved.value });
  }

  if (actionName === "set") {
    if (segments.length === 0) {
      prevValue = clone(data);
      data = value;
      changed = true;
    } else {
      const resolved = resolveOrCreate(data, segments);
      prevValue = clone(resolved.value);
      resolved.parent[resolved.key] = value;
      changed = true;
    }
  } else if (actionName === "delete") {
    const resolved = resolvePath(data, segments);
    if (!resolved || resolved.value === undefined) return err(`Path "${dotPath}" not found`);
    prevValue = clone(resolved.value);
    if (Array.isArray(resolved.parent)) resolved.parent.splice(resolved.key, 1);
    else delete resolved.parent[resolved.key];
    changed = true;
  } else if (actionName === "merge") {
    if (value === undefined || value === null || typeof value !== "object" || Array.isArray(value)) return err("merge requires a plain object value");
    const resolved = resolvePath(data, segments);
    if (!resolved || typeof resolved.value !== "object" || resolved.value === null || Array.isArray(resolved.value)) return err(`Path "${dotPath}" must resolve to an object for merge`);
    prevValue = clone(resolved.value);
    Object.assign(resolved.value, value);
    changed = true;
  } else if (actionName === "arrayAppend") {
    const resolved = resolvePath(data, segments);
    if (!resolved || !Array.isArray(resolved.value)) return err(`Path "${dotPath}" must resolve to an array for arrayAppend`);
    prevValue = clone(resolved.value);
    resolved.value.push(value);
    changed = true;
  } else if (actionName === "arrayRemove") {
    const resolved = resolvePath(data, segments);
    if (!resolved || !Array.isArray(resolved.value)) return err(`Path "${dotPath}" must resolve to an array for arrayRemove`);
    prevValue = clone(resolved.value);
    if (index !== undefined) {
      if (index < 0 || index >= resolved.value.length) return err(`Index ${index} out of bounds (array length: ${resolved.value.length})`);
      resolved.value.splice(index, 1);
    } else if (removeValue !== undefined) {
      const idx = resolved.value.findIndex((v) => JSON.stringify(v) === JSON.stringify(removeValue));
      if (idx === -1) return err("Value not found in array");
      resolved.value.splice(idx, 1);
    } else return err("Specify 'index' or 'removeValue' for arrayRemove");
    changed = true;
  } else if (actionName === "arrayInsert") {
    if (index === undefined) return err("index is required for arrayInsert");
    const resolved = resolvePath(data, segments);
    if (!resolved || !Array.isArray(resolved.value)) return err(`Path "${dotPath}" must resolve to an array for arrayInsert`);
    prevValue = clone(resolved.value);
    resolved.value.splice(index, 0, value);
    changed = true;
  }

  const after = yaml.dump(data, { indent, lineWidth, noRefs: true });
  const originalNormalized = yaml.dump(yaml.load(original) || {}, { indent, lineWidth, noRefs: true });
  const contentChanged = after !== originalNormalized;

  let newValue;
  if (segments.length > 0) {
    const r = resolvePath(data, segments);
    if (r) newValue = r.value;
  } else newValue = data;

  if (dryRun) return ok({ action: actionName, file, path: dotPath, dryRun: true, wouldChange: contentChanged, previousValue: prevValue, newValue, diff: contentChanged ? buildDiff(original, after) : "(no change)" });
  if (!contentChanged) return ok({ action: actionName, file, path: dotPath, changed: false, message: "No changes (value unchanged)" });

  try {
    fs.writeFileSync(file, after, "utf-8");
    return ok({ action: actionName, file, path: dotPath, changed: true, previousValue: prevValue, newValue, diff: buildDiff(original, after) });
  } catch (e) {
    return err(`Cannot write file: ${e.message}`);
  }
}

function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

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
