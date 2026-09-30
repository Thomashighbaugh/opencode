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

import { applyRuntimeEnv, cacheRoot, isCached, loadModel, REQUIRED_MODELS } from './onnx-runtime.ts'

const CHECK_ONLY = process.argv.includes('--check')

async function main(): Promise<number> {
  applyRuntimeEnv()
  const targets = Object.entries(REQUIRED_MODELS) as Array<[string, string]>

  let missing = 0
  let fetched = 0

  for (const [role, modelId] of targets) {
    const cached = isCached(modelId)
    if (cached) {
      console.log(`  ok       ${role.padEnd(10)} ${modelId}`)
      continue
    }
    missing++
    if (CHECK_ONLY) {
      console.log(`  MISSING  ${role.padEnd(10)} ${modelId}`)
      continue
    }
    const t0 = Date.now()
    process.stdout.write(`  fetching ${role.padEnd(10)} ${modelId} … `)
    try {
      await loadModel(modelId, { allowDownload: true })
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
  console.log(`${fetched} fetched, ${targets.length - missing} already present`)
  return missing - fetched > 0 ? 1 : 0
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error(err)
    process.exit(1)
  },
)
