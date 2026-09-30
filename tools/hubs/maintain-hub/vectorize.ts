import { HubSubcommandSpec } from "../../hub-data"

import { TOOLS_BASH } from "../shared-spec-fragments"

const spec: HubSubcommandSpec = {
  label: "vectorize",
  description: "Embed codebase + context into local vector DB for semantic retrieval",
  reminder: "Run vectorization over project code and context.",
  inline: true,

  detailedDescription: `Vectorize the project for semantic retrieval. Two local vector stores are maintained under .opencode/state/vector/ (gitignored):

1. **context.db** — markdown sources: .opencode/context/**, .opencode/rules/**, .opencode/docs/**, AGENTS.md (heading-based chunking).
2. **code.db** — the project source tree (declaration-aware chunking; skips node_modules, .git, build/dist/vendor dirs, and .opencode/state + .opencode/cache for privacy).

Both stores use Ollama embeddings (pedrohml/mxbai-embed-large, local-only) plus an in-process cross-encoder reranker (Xenova/bge-reranker-base via @huggingface/transformers, sigmoid scoring). Zero provider API requests — everything runs locally.

Command (run from the project root, or set OPCODE_DIR):
  node <skill-dir>/scripts/vectorize.ts --all      # context + code
  node <skill-dir>/scripts/vectorize.ts --code     # code store only

where <skill-dir> is skills/vectorize-context (global or project-local .opencode/skills/vectorize-context).

Indexing is incremental (mtime-based): re-runs only embed changed files. Deleted files are cleaned from the store automatically.

The vectorize hook (plugins/hooks/vectorize-hook.ts) keeps both stores fresh as files change — it spawns sync-hook.ts as a child process (10s poll, maintenance mode; the plugin process never loads native modules). The system.transform hook injects <Relevant_Context> (docs) and <Relevant_Code> (source) blocks into complex prompts via a child-process query. Manual querying:
  node <skill-dir>/scripts/query.ts "question"
  node <skill-dir>/scripts/query.ts --code "question"

Stats: node <skill-dir>/scripts/vectorize.ts prints scanned/indexed/skipped/chunks/elapsed per store.`,

  tools: TOOLS_BASH,
  rules: [],
  relatedSkills: ["vectorize-context"],
}

export default spec
