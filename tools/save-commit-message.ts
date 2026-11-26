import { z } from "zod/v4"
import * as fs from "fs"
import * as path from "path"
import type { ToolDefinition } from "./types"

const input = z.object({
  commitMessage: z.string().describe("Commit message"),
})

export default {
  name: "saveCommitMessage",
  description: "Upsert commits message in $TMPDIR/opencode/git/commit-messages/sessionID folder",
  input,
  async execute(args, context) {
    const sessionID = context.sessionID
    const commitMessage = args.commitMessage
    const filePath = path.join(process.env.TMPDIR || "/tmp", "opencode", "git", "commit-messages", sessionID)

    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, commitMessage)

    return { content: "Commit message upserted successfully" }
  },
} satisfies ToolDefinition<z.infer<typeof input>>
