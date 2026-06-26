import { tool } from "@opencode-ai/plugin"
import { withToolCache } from "./cache-utils"

export default tool({
  description: "Get current session ID",
  args: {},
  async execute(args, context) {
    return withToolCache("getSessionID", args, () => {
      return context.sessionID
    })
  },
})
