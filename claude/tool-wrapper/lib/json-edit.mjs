// Ported from tools/json-edit.ts (OpenCode tool) — same logic, no @opencode-ai/plugin dependency.
import fs from "node:fs";
import { JSONPath } from "jsonpath-plus";

const VALID_ACTIONS = ["get", "set", "delete", "merge", "arrayAppend", "arrayRemove", "arrayInsert"];

export function run(args) {
  const { file, action, path: jsonPath, value, index, removeValue, dryRun } = args;
  const indent = args.indentSize ?? 2;

  if (!file) return err("file is required");
  if (!action) return err("action is required");
  if (!jsonPath) return err("path is required (JSONPath expression)");
  if (!VALID_ACTIONS.includes(action)) return err(`Invalid action. Valid: ${VALID_ACTIONS.join(", ")}`);

  let original, data;
  try {
    original = fs.readFileSync(file, "utf-8");
  } catch (e) {
    return err(`Cannot read file: ${e.message}`);
  }
  try {
    data = JSON.parse(original);
  } catch (e) {
    return err(`Invalid JSON: ${e.message}`);
  }

  const trailingNewline = args.trailingNewline !== false;

  function resolvePath(pathExpr) {
    try {
      const raw = JSONPath({ path: pathExpr, json: data, resultType: "all" });
      return Array.isArray(raw) ? raw : [];
    } catch (e) {
      throw new Error(`JSONPath error: ${e.message}`);
    }
  }

  if (action === "get") {
    const matches = resolvePath(jsonPath);
    if (matches.length === 0) return err(`Path "${jsonPath}" not found`);
    return ok({ action: "get", file, path: jsonPath, matches: matches.length, value: matches.length === 1 ? matches[0].value : matches.map((m) => m.value), fullPaths: matches.map((m) => m.fullPath || m.path) });
  }

  const matches = resolvePath(jsonPath);
  if (matches.length === 0 && action !== "set") return err(`Path "${jsonPath}" not found`);

  const prevValue = matches.length > 0 ? clone(matches[0].value) : undefined;

  try {
    switch (action) {
      case "set": {
        if (matches.length > 0) {
          const { parent, parentProperty } = matches[0];
          parent[parentProperty] = value;
        } else {
          if (typeof data === "object" && data !== null && !Array.isArray(data)) {
            const key = jsonPath.replace(/^\$\.?/, "");
            if (key && !key.includes("[") && !key.includes(".")) data[key] = value;
            else return err(`Cannot create path "${jsonPath}". Use a simple dot-path like "$.newKey".`);
          } else return err(`Cannot set on non-object root at path "${jsonPath}"`);
        }
        break;
      }
      case "delete": {
        const { parent, parentProperty } = matches[0];
        if (Array.isArray(parent)) parent.splice(parentProperty, 1);
        else delete parent[parentProperty];
        break;
      }
      case "merge": {
        if (value === undefined || value === null || typeof value !== "object" || Array.isArray(value)) return err("merge requires a plain object value");
        const { parent, parentProperty } = matches[0];
        const target = parent[parentProperty];
        if (typeof target !== "object" || target === null || Array.isArray(target)) return err("merge target must be an object");
        Object.assign(target, value);
        break;
      }
      case "arrayAppend": {
        const { parent, parentProperty } = matches[0];
        const arr = parent[parentProperty];
        if (!Array.isArray(arr)) return err("Path does not resolve to an array");
        arr.push(value);
        break;
      }
      case "arrayRemove": {
        const { parent, parentProperty } = matches[0];
        const arr = parent[parentProperty];
        if (!Array.isArray(arr)) return err("Path does not resolve to an array");
        if (index !== undefined) {
          if (index < 0 || index >= arr.length) return err(`Index ${index} out of bounds (array length: ${arr.length})`);
          arr.splice(index, 1);
        } else if (removeValue !== undefined) {
          const idx = arr.findIndex((v) => JSON.stringify(v) === JSON.stringify(removeValue));
          if (idx === -1) return err("Value not found in array");
          arr.splice(idx, 1);
        } else return err("Specify 'index' or 'removeValue' for arrayRemove");
        break;
      }
      case "arrayInsert": {
        if (index === undefined) return err("index is required for arrayInsert");
        const { parent, parentProperty } = matches[0];
        const arr = parent[parentProperty];
        if (!Array.isArray(arr)) return err("Path does not resolve to an array");
        arr.splice(index, 0, value);
        break;
      }
      default:
        return err(`Unknown action: ${action}`);
    }
  } catch (e) {
    return err(`Operation failed: ${e.message}`);
  }

  const after = JSON.stringify(data, null, indent) + (trailingNewline ? "\n" : "");
  const changed = after !== original;
  const post = resolvePath(jsonPath);
  const newValue = post.length > 0 ? (post.length === 1 ? post[0].value : post.map((m) => m.value)) : undefined;

  if (dryRun) return ok({ action, file, path: jsonPath, dryRun: true, wouldChange: changed, previousValue: prevValue, newValue, diff: changed ? buildDiff(original, after) : "(no change)" });
  if (!changed) return ok({ action, file, path: jsonPath, changed: false, message: "No changes (value unchanged)" });

  try {
    fs.writeFileSync(file, after, "utf-8");
    return ok({ action, file, path: jsonPath, changed: true, previousValue: prevValue, newValue, diff: buildDiff(original, after) });
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
