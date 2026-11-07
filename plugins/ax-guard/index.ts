/**
 * ax-guard — server entrypoint (OpenCode 2).
 *
 * Rejects bash commands whose first HTTP step is curl/wget, or a throwaway
 * python/node parser fetches a URL. The rejection message names the ax call to
 * use instead, so the correction is in the error the model reads.
 *
 * This is the enforcement half of `rules/ax-first.md`; the rule alone was being
 * diluted across sixteen instruction files, especially in research runs.
 */

import { axGuard } from "./guard.ts"

export default {
  id: "ax-guard",
  async setup(ctx: any) {
    await ctx.tool.hook("execute.before", (event: any) => {
      if (String(event.tool).toLowerCase() !== "bash") return
      const input = event.input as { command?: unknown } | undefined
      if (!input || typeof input.command !== "string") return
      const rejection = axGuard(input.command)
      if (rejection) throw new Error(rejection)
    })
  },
}
