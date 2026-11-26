import { z } from "zod/v4"
import { withToolCache } from "./cache-utils"
import type { ToolDefinition } from "./types"

const input = z.object({})

export default {
  name: "getSessionID",
  description: "Get current session ID",
  input,
  async execute(args, context) {
    const content = withToolCache("getSessionID", args, () => context.sessionID)
    return { content }
  },
} satisfies ToolDefinition<z.infer<typeof input>>
