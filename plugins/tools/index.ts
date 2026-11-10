/**
 * Server entrypoint for this repository's tool suite (OpenCode 2).
 *
 * V1 discovered custom tools by scanning every config directory for
 * `{tool,tools}/*.{js,ts}` and importing each file's default export
 * (`packages/opencode/src/tool/registry.ts`). V2 removed that scan: a tool
 * exists only when a plugin registers it through
 * `ctx.tool.transform(editor => editor.add(...))`. This file is that plugin.
 *
 * Plain object rather than `Plugin.define`: importing `@opencode/plugin` here
 * would load `@opencode/schema` against the host binary's embedded effect,
 * which is the failure mode documented at the top of `plugins/hubs/index.ts`.
 *
 * Three things the registration does that the V1 file-based loader did for
 * free:
 *
 *   1. **Input schemas are converted, not passed through.** V2 accepts a plain
 *      JSON Schema, an Effect codec, or a Standard Schema. The host converts a
 *      Standard Schema with its *own* zod instance (`schema instanceof
 *      $ZodType`), which never matches the zod copy this repository imports,
 *      and zod 3.25's `~standard` carries no `jsonSchema` — so passing our
 *      zod schemas straight through throws "Schema vendor \"zod\" does not
 *      support JSON Schema conversion". Converting here with our own zod copy
 *      sidesteps the module-registry split entirely.
 *   2. **`codemode: false`** keeps each tool on the provider's native tool
 *      list, the V1 behaviour.
 *   3. **`directory` is injected.** V2's tool context carries no filesystem
 *      path (`{sessionID, agent, messageID, id, signal, progress}`); the
 *      project root comes from the plugin's `ctx.location.directory`.
 */

import { z } from "zod/v4"

import agentCache from "../../tools/agent-cache.ts"
import agentContext from "../../tools/agentContext.ts"
import artifacts from "../../tools/artifacts.ts"
import cache from "../../tools/cache.ts"
import codeSearch from "../../tools/codeSearch.ts"
import confEdit from "../../tools/conf-edit.ts"
import documentConvert from "../../tools/document-convert.ts"
import genRoutingDocs from "../../tools/gen-routing-docs.ts"
import getCommitMessage from "../../tools/getCommitMessage.ts"
import getSessionID from "../../tools/getSessionID.ts"
import graphQuery from "../../tools/graphQuery.ts"
import jsonEdit from "../../tools/json-edit.ts"
import listAgents from "../../tools/listAgents.ts"
import loadSkill from "../../tools/loadSkill.ts"
import modeState from "../../tools/modeState.ts"
import multiEdit from "../../tools/multi-edit.ts"
import promptCompiler from "../../tools/prompt-compiler.ts"
import promptQueue from "../../tools/prompt-queue.ts"
import regexEdit from "../../tools/regex-edit.ts"
import rerank from "../../tools/rerank.ts"
import runSkillScript from "../../tools/runSkillScript.ts"
import saveCommitMessage from "../../tools/saveCommitMessage.ts"
import scopeContext from "../../tools/scope-context.ts"
import semanticCache from "../../tools/semantic-cache.ts"
import skillCategories from "../../tools/skill-categories.ts"
import taskTodos from "../../tools/taskTodos.ts"
import toolScaffolder from "../../tools/tool-scaffolder.ts"
import validateDelegation from "../../tools/validate-delegation.ts"
import yamlEdit from "../../tools/yaml-edit.ts"

import type { ToolDefinition, ToolInput } from "../../tools/types.ts"

/** Every tool this repository exposes, in registration order. */
const TOOLS: ToolDefinition<any>[] = [
  agentCache,
  agentContext,
  artifacts,
  cache,
  codeSearch,
  confEdit,
  documentConvert,
  genRoutingDocs,
  getCommitMessage,
  getSessionID,
  graphQuery,
  jsonEdit,
  listAgents,
  loadSkill,
  modeState,
  multiEdit,
  promptCompiler,
  promptQueue,
  regexEdit,
  rerank,
  runSkillScript,
  saveCommitMessage,
  scopeContext,
  semanticCache,
  skillCategories,
  taskTodos,
  toolScaffolder,
  validateDelegation,
  yamlEdit,
]

/**
 * Convert a tool input to the JSON Schema V2 consumes.
 *
 * `unrepresentable: "any"` keeps a single exotic field type from failing the
 * whole registration — a tool that cannot describe one argument is still more
 * useful than a tool that never appears in the registry.
 */
function toJsonSchema(input: ToolInput): Record<string, unknown> {
  if (!("~standard" in (input as object))) return input as Record<string, unknown>
  return z.toJSONSchema(input as never, {
    io: "input",
    unrepresentable: "any",
  }) as unknown as Record<string, unknown>
}

export default {
  id: "tools",
  async setup(ctx: any) {
    const directory: string = ctx?.location?.directory ?? process.cwd()

    // `transform` returns a promise in the promise-flavoured plugin API
    // (`Transform<Input> = (cb) => Promise<Registration>`), so it is awaited:
    // a registration that has not settled when `setup` returns is not in the
    // registry yet.
    await ctx.tool.transform((editor: any) => {
      for (const tool of TOOLS) {
        editor.add({
          name: tool.name,
          description: tool.description,
          input: toJsonSchema(tool.input),
          options: { codemode: false },
          execute: async (args: any, context: any) =>
            tool.execute(args, {
              ...context,
              directory: context?.directory ?? directory,
            }),
        })
      }
    })
  },
}
