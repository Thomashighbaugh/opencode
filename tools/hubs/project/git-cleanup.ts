import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "git-cleanup",
  description: "Fix orphaned CHANGELOG entries referencing commits not in git history after .git/ rebuild — preserves entries, removes bad refs",
  reminder: "Clean up orphaned commit references in CHANGELOG.",
  inline: true,

  detailedDescription: `Fixes orphaned CHANGELOG entries that reference commits no longer in git history. This happens after .git/ rebuilds, history rewrites, or squash merges that remove commits from the object database.

Process:
1. Parse CHANGELOG for commit hash references.
2. Check each hash against git's object database.
3. For orphans (hash not found): preserve the changelog entry (it documents what changed) but remove the bad hash reference so the changelog doesn't link to nothing.

The entries are preserved — only the broken commit references are cleaned. Use after git history operations that might orphan CHANGELOG references.`,

  tools: ["bash"],
  relatedSkills: ["changelog-generator"],
}

export default spec