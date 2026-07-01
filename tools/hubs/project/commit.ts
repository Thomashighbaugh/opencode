import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "commit",
  description: "Create well-formatted conventional commit",
  reminder: "Create conventional commit with staged changes.",
  skill: "conventional-commit",

  detailedDescription: `Creates a conventional commit from currently staged changes. The conventional-commit skill:

1. Inspects staged changes (git diff --cached).
2. Classifies the change: feat, fix, refactor, docs, test, chore, perf, etc.
3. Drafts a conventional commit message: type(scope): subject, followed by body and footer as needed.
4. Checks for secrets before committing (security scan).
5. Commits with the drafted message.

Follows the Conventional Commits specification (type, optional scope, breaking change footer). The commit message is saved to the session temp dir and can be retrieved via getCommitMessage if you want to review before the actual commit.

Use whenever you're ready to commit staged changes with a proper message.`,

  tools: ["loadSkill", "bash", "saveCommitMessage"],
  rules: ["security"],
  relatedSkills: [],

  examples: [
    {
      input: "/project commit",
      approach: "git diff --cached shows new file src/auth/jwt.ts + modified src/auth/index.ts. Classify: feat(auth): add JWT token generation. Body: 'adds sign and verify functions for HS256'. Commit."
    }
  ]
}

export default spec