import { tool } from "@opencode-ai/plugin"
import * as fs from "fs"
import * as path from "path"
import { withToolCache } from "./cache-utils"

export default tool({
  description: "Get the upserted commit message from $TMPDIR/opencode/git/commit-messages/sessionID folder",
  args: {},
  async execute(args, context) {
    return withToolCache("getCommitMessage", args, () => {
      const sessionID = context.sessionID
      const filePath = path.join(process.env.TMPDIR || "/tmp", "opencode", "git", "commit-messages", sessionID)

      if (fs.existsSync(filePath)) {
        const commitMessage = fs.readFileSync(filePath, "utf-8")
        return commitMessage
      }

      return `Commit message for session ID ${sessionID} does not exist`
    })
  },
})
