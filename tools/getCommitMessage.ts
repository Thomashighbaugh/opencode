import { z } from "zod/v4"
import * as fs from "fs"
import * as path from "path"
import { withToolCache } from "./cache-utils"
import type { ToolDefinition } from "./types"

const input = z.object({})

export default {
  name: "getCommitMessage",
  description: "Get the upserted commit message from $TMPDIR/opencode/git/commit-messages/sessionID folder",
  input,
  async execute(args, context) {
    const content = withToolCache("getCommitMessage", args, () => {
      const sessionID = context.sessionID
      const filePath = path.join(process.env.TMPDIR || "/tmp", "opencode", "git", "commit-messages", sessionID)

      if (fs.existsSync(filePath)) {
        const commitMessage = fs.readFileSync(filePath, "utf-8")
        return commitMessage
      }

      return `Commit message for session ID ${sessionID} does not exist`
    })
    return { content }
  },
} satisfies ToolDefinition<z.infer<typeof input>>
