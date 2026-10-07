#!/usr/bin/env node

/**
 * scan-injection.ts — flag prompt-injection in untrusted content.
 *
 * Every piece of text that enters context from outside the conversation is an
 * injection vector: a fetched web page, a tool result, an MCP response, a file
 * read from a repository you do not control. The scanner runs a sequence
 * classifier trained on prompt injections over that text and reports whether it
 * reads as one.
 *
 * Usage:
 *   node scan-injection.ts --file path/to/content.txt
 *   echo '{"content":"...","source":"https://..."}' | node scan-injection.ts --stdin
 *
 * Output: JSON { available, injection, label, score, source }.
 * Exit code: 0 clean, 1 injection detected, 0 when the model is unavailable
 * (a missing model disables the scan; it must never be read as "clean" — the
 * `available` field carries that distinction).
 *
 * The model is optional: `prefetch-models.ts` fetches it, and this degrades to
 * `available: false` without it.
 */

import fs from 'fs'
import { classifySequence, isInjection } from '../../vectorize-context/scripts/classifiers.ts'

export interface InjectionScanResult {
  available: boolean
  injection: boolean
  label: string | null
  score: number | null
  source: string | null
}

export async function scanInjection(content: string, source: string | null = null): Promise<InjectionScanResult> {
  const verdict = await classifySequence(content)
  if (!verdict) return { available: false, injection: false, label: null, score: null, source }
  return {
    available: true,
    injection: isInjection(verdict),
    label: verdict.label,
    score: verdict.score,
    source,
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  let content = ''
  let source: string | null = null

  if (args.includes('--file')) {
    const idx = args.indexOf('--file')
    const file = args[idx + 1]
    if (!file) {
      process.stderr.write('Usage: node scan-injection.ts --file <path> | --stdin\n')
      process.exit(2)
    }
    content = fs.readFileSync(file, 'utf-8')
    source = file
  } else if (args.includes('--stdin')) {
    let input = ''
    process.stdin.on('data', (c) => (input += c))
    process.stdin.on('end', async () => {
      try {
        const parsed = JSON.parse(input)
        content = parsed.content || ''
        source = parsed.source || null
      } catch {
        content = input
      }
      const result = await scanInjection(content, source)
      process.stdout.write(JSON.stringify(result, null, 2) + '\n')
      process.exit(result.injection ? 1 : 0)
    })
    return
  } else if (args.length && !args[0].startsWith('--')) {
    content = fs.readFileSync(args[0], 'utf-8')
    source = args[0]
  } else {
    process.stderr.write('Usage: node scan-injection.ts --file <path> | --stdin | <path>\n')
    process.exit(2)
  }

  const result = await scanInjection(content, source)
  process.stdout.write(JSON.stringify(result, null, 2) + '\n')
  process.exit(result.injection ? 1 : 0)
}

const isMain = process.argv[1] && process.argv[1].endsWith('scan-injection.ts')
if (isMain) void main()
