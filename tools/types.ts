/**
 * OpenCode 2 tool contract.
 *
 * V1 discovered custom tools by scanning every config directory for
 * `{tool,tools}/*.{js,ts}` and importing each file's default export
 * (`packages/opencode/src/tool/registry.ts`). V2 removed that scan: a tool
 * exists only when a plugin registers it through
 * `ctx.tool.transform(editor => editor.add(...))`.
 *
 * `plugins/tools/index.ts` is that plugin. Every tool in this directory is a
 * V2 tool definition it registers.
 *
 * The types live here rather than being imported from `@opencode/plugin`:
 * importing that package at runtime pulls `@opencode/schema` against the host
 * binary's embedded effect, which breaks plugin loading (see the note at the
 * top of `plugins/hubs/index.ts`).
 */

/** JSON Schema (draft 2020-12) subset used for tool inputs. */
export interface JsonSchema {
  type?: "object" | "array" | "string" | "number" | "integer" | "boolean" | "null"
  description?: string
  properties?: Record<string, JsonSchema>
  required?: readonly string[]
  items?: JsonSchema
  enum?: readonly (string | number | boolean)[]
  additionalProperties?: boolean
  default?: unknown
  [key: string]: unknown
}

/** Standard Schema V1 surface — what zod exposes as `~standard`. */
export interface StandardSchemaLike {
  readonly "~standard": {
    readonly vendor: string
    readonly version: number
    readonly validate: (value: unknown) => unknown
  }
}

/**
 * A tool input is either a plain JSON Schema or a Standard Schema (zod v4).
 * `plugins/tools/index.ts` converts Standard Schemas to JSON Schema with the
 * repository's own zod copy: the host's zod instance is a different module
 * registry, so the host's `instanceof $ZodType` check never matches a schema
 * built here.
 */
export type ToolInput = JsonSchema | StandardSchemaLike

export interface ToolOptions {
  /** `false` keeps the tool on the provider's native tool list (V1 behaviour). */
  readonly codemode?: boolean
  readonly namespace?: string
  readonly permission?: string
}

/**
 * The context V2 hands to `execute`. It carries no filesystem path, so the
 * registering plugin injects `directory` (the project root) before calling.
 */
export interface ToolContext {
  readonly sessionID: string
  readonly agent: string
  readonly messageID: string
  readonly id: string
  readonly signal: AbortSignal
  readonly progress: (update: Record<string, unknown>) => Promise<void>
  /** Project root — injected by `plugins/tools/index.ts`. */
  readonly directory: string
}

/** V2 tool result. `content` is what the model sees. */
export interface ToolResult {
  readonly content: string
  readonly metadata?: Record<string, unknown>
}

export interface ToolDefinition<Args = Record<string, any>> {
  /** Tool name. V2 normalises it to `[A-Za-z0-9_-]+`. */
  readonly name: string
  readonly description: string
  readonly input: ToolInput
  readonly options?: ToolOptions
  execute(args: Args, context: ToolContext): Promise<ToolResult>
}

/** Narrow a tool input to a JSON Schema (the shape V2 consumes). */
export function isJsonSchema(input: ToolInput): input is JsonSchema {
  return !("~standard" in (input as object))
}
