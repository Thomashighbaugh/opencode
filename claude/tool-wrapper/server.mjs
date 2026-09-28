#!/usr/bin/env node
// Standalone MCP server exposing OpenCode's mass-edit tools (regex/JSON/YAML/
// conf/multi-file) to Claude Code. These five are the ones judged worth
// keeping from tools/*.ts — see claude/plugins/opencode-bridge for the rest
// of the OpenCode-bridge plugin. Registered as this plugin's mcpServers
// entry; run standalone with `node server.mjs` for manual testing.
//
// Rationale: doing a mass find/replace across N files as one regex call
// costs one round trip; doing it as N individual Edit calls costs N. Prefer
// these tools whenever an edit is mechanical and repeats across lines/files.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { run as regexEdit } from "./lib/regex-edit.mjs";
import { run as jsonEdit } from "./lib/json-edit.mjs";
import { run as yamlEdit } from "./lib/yaml-edit.mjs";
import { run as confEdit } from "./lib/conf-edit.mjs";
import { run as multiEdit } from "./lib/multi-edit.mjs";

const server = new McpServer({ name: "opencode-edit-tools", version: "0.1.0" });

function asContent(result) {
  return { content: [{ type: "text", text: JSON.stringify(result) }] };
}

server.tool(
  "regex_edit",
  "Edit a text file using regex patterns and line operations — replace, insert, delete lines, get matching lines. Cheaper than a sequence of individual Edit calls for mechanical, pattern-based changes.",
  {
    file: z.string().describe("Path to file to edit (absolute or relative to cwd)"),
    action: z.enum(["replace", "replaceAll", "insertBefore", "insertAfter", "deleteMatching", "deleteRange", "insertAtLine", "getLines"]),
    pattern: z.string().optional().describe("Regex pattern (for replace, insertBefore, insertAfter, deleteMatching, getLines)"),
    replacement: z.string().optional().describe("Replacement text (for replace, replaceAll)"),
    content: z.string().optional().describe("Content to insert (for insertBefore, insertAfter, insertAtLine)"),
    startLine: z.number().optional(),
    endLine: z.number().optional(),
    line: z.number().optional(),
    flags: z.string().optional().describe("Regex flags. Default: '' for replace, 'g' for replaceAll"),
    dryRun: z.boolean().optional(),
    encoding: z.string().optional(),
  },
  async (args) => asContent(regexEdit(args)),
);

server.tool(
  "json_edit",
  "Edit a JSON/JSONC file using a JSONPath expression — get, set, delete, merge, array operations. No jq or inline scripts.",
  {
    file: z.string(),
    action: z.enum(["get", "set", "delete", "merge", "arrayAppend", "arrayRemove", "arrayInsert"]),
    path: z.string().describe("JSONPath expression, e.g. '$.config.port', '$.users[0].name'"),
    value: z.any().optional(),
    index: z.number().optional(),
    removeValue: z.any().optional(),
    indentSize: z.number().optional(),
    trailingNewline: z.boolean().optional(),
    dryRun: z.boolean().optional(),
  },
  async (args) => asContent(jsonEdit(args)),
);

server.tool(
  "yaml_edit",
  "Edit a YAML file using dot-path notation — get, set, delete, merge, array operations. No yq or sed-on-YAML.",
  {
    file: z.string(),
    action: z.enum(["get", "set", "delete", "merge", "arrayAppend", "arrayRemove", "arrayInsert"]),
    path: z.string().describe("Dot-path, e.g. 'server.port', 'users.0.name'"),
    value: z.any().optional(),
    index: z.number().optional(),
    removeValue: z.any().optional(),
    indentSize: z.number().optional(),
    lineWidth: z.number().optional(),
    dryRun: z.boolean().optional(),
  },
  async (args) => asContent(yamlEdit(args)),
);

server.tool(
  "conf_edit",
  "Edit a config file (.env, INI, key=value) — get, set, delete, comment/uncomment a key. No sed required.",
  {
    file: z.string(),
    action: z.enum(["get", "set", "delete", "commentOut", "uncomment"]),
    key: z.string().optional(),
    value: z.string().optional(),
    section: z.string().optional().describe("INI section header for scoped operations"),
    separator: z.string().optional().describe("Key-value separator, default '='"),
    commentChar: z.string().optional().describe("Comment character, default '#'"),
    format: z.enum(["auto", "env", "ini", "kv"]).optional(),
    dryRun: z.boolean().optional(),
  },
  async (args) => asContent(confEdit(args)),
);

server.tool(
  "multi_edit",
  "Batch find/replace across many files matched by a glob pattern in one call — cheaper than one Edit call per file for a repeated mechanical change. Defaults to dryRun so you can preview the diff before committing to it.",
  {
    glob: z.string().describe("Glob pattern, e.g. 'src/**/*.ts'"),
    action: z.enum(["find", "replace", "replaceAll"]),
    pattern: z.string().describe("Regex or string pattern to search for"),
    replacement: z.string().optional(),
    flags: z.string().optional(),
    encoding: z.string().optional(),
    dryRun: z.boolean().optional().describe("Default true — preview before writing"),
    maxFiles: z.number().optional().describe("Safety limit on files processed, default 50"),
    cwd: z.string().optional(),
    binaryExts: z.array(z.string()).optional(),
  },
  async (args) => asContent(multiEdit(args)),
);

const transport = new StdioServerTransport();
await server.connect(transport);
