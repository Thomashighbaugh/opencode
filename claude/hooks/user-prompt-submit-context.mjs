#!/usr/bin/env node
// UserPromptSubmit hook — semantic retrieval over the current project's
// .opencode/context/ knowledge base (if any) and source tree, injected as
// additionalContext. Ported from plugins/hooks/hooks.ts's
// experimental.chat.system.transform vector-search block, generalized from
// "this one repo" to "whatever project cwd points at" since it now runs as
// a global Claude Code hook instead of an OpenCode plugin bound to one
// project. Shells out to the already-vendored, SDK-independent
// skills/vectorize-context/scripts/query-hook.mjs (symlinked in at
// ~/.claude/skills/vectorize-context/) so the embedding/rerank machinery
// lives in one place. Degrades to no-op if that project has never been
// vectorized (skills/vectorize-context's own /project vectorize step) or if
// the skill isn't installed — never blocks the prompt.
import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

const COMPLEXITY_KEYWORDS = [
  "refactor", "architecture", "design", "why", "how", "debug", "fix",
  "implement", "build", "create", "optimize", "security", "performance",
  "test", "review", "plan", "decompose", "analyze", "overhaul", "modular",
  "pattern", "convention", "dependency", "integration", "migrate", "upgrade",
];

const QUERY_SCRIPT = join(homedir(), ".claude", "skills", "vectorize-context", "scripts", "query-hook.mjs");
const SPAWN_TIMEOUT_MS = 20_000;

function truncate(text, maxChars) {
  return text.length > maxChars ? text.slice(0, maxChars) + "\n[...truncated]" : text;
}

function runQueryHook(cwd, query) {
  return new Promise((resolve) => {
    let stdout = "";
    const child = spawn(process.execPath, [QUERY_SCRIPT, query], {
      env: { ...process.env, OPCODE_DIR: cwd },
      stdio: ["ignore", "pipe", "pipe"],
    });
    const killTimer = setTimeout(() => {
      try { child.kill("SIGKILL"); } catch { /* already gone */ }
    }, SPAWN_TIMEOUT_MS);
    child.stdout?.on("data", (d) => { stdout += d.toString(); });
    child.on("close", () => {
      clearTimeout(killTimer);
      try { resolve(JSON.parse(stdout)); } catch { resolve({ context: [], code: [] }); }
    });
    child.on("error", () => {
      clearTimeout(killTimer);
      resolve({ context: [], code: [] });
    });
  });
}

async function main() {
  let input;
  try {
    input = JSON.parse(readFileSync(0, "utf-8"));
  } catch {
    process.exit(0);
  }

  const prompt = (input?.prompt || "").trim();
  const cwd = input?.cwd || process.cwd();

  if (prompt.length < 10) process.exit(0);
  const lower = prompt.toLowerCase();
  if (!COMPLEXITY_KEYWORDS.some((kw) => lower.includes(kw))) process.exit(0);
  if (!existsSync(QUERY_SCRIPT)) process.exit(0);

  const results = await runQueryHook(cwd, prompt.slice(0, 2000));

  const ctxRelevant = (results.context || [])
    .map((r) => `**${r.file}**\n${r.content || ""}`)
    .slice(0, 5);
  const codeRelevant = (results.code || [])
    .map((r) => `**${r.file}${r.heading ? " — " + r.heading : ""}**\n${r.content || ""}`)
    .slice(0, 4);

  if (ctxRelevant.length === 0 && codeRelevant.length === 0) process.exit(0);

  const blocks = [];
  if (ctxRelevant.length > 0) blocks.push(truncate(`<Relevant_Context>\n${ctxRelevant.join("\n\n---\n\n")}\n</Relevant_Context>`, 4000));
  if (codeRelevant.length > 0) blocks.push(truncate(`<Relevant_Code>\n${codeRelevant.join("\n\n---\n\n")}\n</Relevant_Code>`, 3200));

  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "UserPromptSubmit",
      additionalContext: blocks.join("\n\n"),
    },
  }));
  process.exit(0);
}

main().catch(() => process.exit(0));
