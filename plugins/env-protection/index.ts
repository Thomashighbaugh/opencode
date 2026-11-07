/**
 * env-protection — server entrypoint (OpenCode 2).
 *
 * Local replacement for `@opencode-plugins/env-protection` (which only ships V1
 * hooks). Blocks the `read` tool on .env/.credential/.secret paths. OpenCode V2
 * has no built-in equivalent — its docs present this exact hook as the example.
 */

const PROTECTED = [".env", ".credential", ".secret"]

export default {
  id: "env-protection",
  async setup(ctx: any) {
    await ctx.tool.hook("execute.before", (event: any) => {
      if (String(event.tool).toLowerCase() !== "read") return
      const input = event.input as Record<string, unknown> | undefined
      const target = String(input?.filePath ?? input?.path ?? "")
      if (!target) return
      if (PROTECTED.some((name) => target.toLowerCase().includes(name))) {
        throw new Error("Do not read .env files")
      }
    })
  },
}
