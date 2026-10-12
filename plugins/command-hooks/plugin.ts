/**
 * command-hooks/plugin.ts — the loader-facing entry.
 *
 * OpenCode's legacy plugin loader walks every enumerable export of the file it
 * loads and invokes each one as a plugin factory. Any non-function export — or
 * a helper that throws when handed the plugin input — makes the loader throw
 * and silently drop the *entire* plugin. `./index.ts` deliberately exports its
 * helpers for the test suite, so it cannot be loaded directly.
 *
 * This barrel re-exports only the default plugin function. `opencode.jsonc`
 * registers this file, not `./index.ts`.
 */
export { default } from './index.ts'
