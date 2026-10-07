/**
 * prefetch-models.ts — download every ONNX model this harness uses.
 *
 * The query-time loaders (the reranker and the gate's classifier) refuse to
 * download: a model fetch inside a turn is indistinguishable from a hang. That
 * refusal is only safe if something fetches them ahead of time, so this script
 * is the thing that makes the "no network on the hot path" guarantee hold.
 *
 *   npx tsx skills/vectorize-context/scripts/prefetch-models.ts
 *   npx tsx skills/vectorize-context/scripts/prefetch-models.ts --check   # report only
 *
 * Idempotent: an already-cached model is reported and skipped.
 */

import {
  applyRuntimeEnv,
  cacheRoot,
  isCached,
  loadModel,
  loadPipeline,
  REQUIRED_MODELS,
  OPTIONAL_MODELS,
} from './onnx-runtime.ts'

const CHECK_ONLY = process.argv.includes('--check')
const REQUIRED_ONLY = process.argv.includes('--required-only')

interface Target {
  role: string
  id: string
  file: string
  /** Present for pipeline (task-head) models; absent for raw AutoModel ones. */
  task?: string
}

function targets(): Target[] {
  const required: Target[] = Object.entries(REQUIRED_MODELS).map(([role, id]) => ({
    role,
    id,
    file: 'onnx/model_quantized.onnx',
  }))
  if (REQUIRED_ONLY) return required
  const optional: Target[] = Object.entries(OPTIONAL_MODELS).map(([role, m]) => ({
    role,
    id: m.id,
    file: m.cachedFile,
    task: m.task,
  }))
  return [...required, ...optional]
}

async function main(): Promise<number> {
  applyRuntimeEnv()
  const list = targets()

  let missing = 0
  let fetched = 0

  for (const { role, id, file, task } of list) {
    if (isCached(id, file)) {
      console.log(`  ok       ${role.padEnd(12)} ${id}`)
      continue
    }
    missing++
    if (CHECK_ONLY) {
      console.log(`  MISSING  ${role.padEnd(12)} ${id}`)
      continue
    }
    const t0 = Date.now()
    process.stdout.write(`  fetching ${role.padEnd(12)} ${id} … `)
    try {
      // Task-head models load through a pipeline; the NLI/embedder/reranker
      // through the raw loader. Both honour the same cache layout.
      if (task) await loadPipeline(task, id, { allowDownload: true, cachedFile: file })
      else await loadModel(id, { allowDownload: true })
      const ms = Date.now() - t0
      console.log(`done (${(ms / 1000).toFixed(1)}s)`)
      fetched++
    } catch (e) {
      console.log(`FAILED — ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  console.log(`\ncache: ${cacheRoot()}`)
  if (CHECK_ONLY) {
    console.log(missing ? `${missing} model(s) missing — run without --check to fetch` : 'all models cached')
    return missing ? 1 : 0
  }
  console.log(`${fetched} fetched, ${list.length - missing} already present`)
  return missing - fetched > 0 ? 1 : 0
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error(err)
    process.exit(1)
  },
)
