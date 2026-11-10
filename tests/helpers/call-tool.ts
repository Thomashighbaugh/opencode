/**
 * call-tool.ts — invoke an OpenCode 2 tool the way the runtime does.
 *
 * OpenCode 2 changed the tool result contract: a handler returns
 * `{ content }` — the text the model reads — instead of a bare string. V1
 * tests did `JSON.parse(await handler(args, ctx))`, which now fails on the
 * envelope. Tests that assert on a tool's JSON payload go through this
 * helper so they do not have to know about the envelope.
 *
 * A handler that still returns a plain string (an older plugin) still works.
 */

/** The context a tool receives. `directory` is injected by the registering plugin. */
export interface ToolCallContext {
  directory?: string
  [key: string]: unknown
}

export interface ToolResultEnvelope {
  content?: string
  output?: string
  metadata?: Record<string, unknown>
}

/**
 * Call a tool module's handler and return its parsed payload.
 *
 * @param mod The imported tool module (`{ default: { execute } }`).
 * @param args The tool input.
 * @param context The tool context.
 */
export async function callTool(
  mod: unknown,
  args: Record<string, unknown> = {},
  context: ToolCallContext = {},
): Promise<any> {
  const module = mod as { default?: { execute?: Function }; execute?: Function }
  const handler = module.default?.execute ?? module.execute
  if (typeof handler !== "function") throw new Error("tool module has no execute handler")
  const result = await handler(args, context)
  if (typeof result === "string") return parse(result)
  const envelope = result as ToolResultEnvelope | undefined
  const content = envelope?.content ?? envelope?.output
  if (typeof content === "string") return parse(content)
  return result
}

/** Parse JSON when the payload is JSON; return the raw text otherwise. */
function parse(text: string): any {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}
