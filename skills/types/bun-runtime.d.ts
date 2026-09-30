/**
 * Minimal ambient declarations for the Bun runtime these scripts execute under.
 *
 * `extract-plugin-api.ts` runs under Bun and uses `Bun.file(...).text()`,
 * `Bun.write(...)`, and `import.meta.dir`. None of those exist in the Node type
 * set, so `skills/tsconfig.json` reported 10 errors on code that is correct for
 * its runtime.
 *
 * The fix is deliberately NOT `@types/bun`. That package types the whole Bun
 * surface, and pulling a network dependency into a skills typecheck to silence
 * three call sites would be a worse trade than declaring what is used. This file
 * names the exact assumption: these scripts need a Bun runtime, and if one of
 * them is ever moved to Node, this file is the list of what has to change.
 *
 * Deliberately incomplete: only the members actually called are declared, so a
 * new unsupported Bun API fails the typecheck instead of being quietly assumed.
 */

interface BunFile {
  text(): Promise<string>
  json(): Promise<unknown>
  arrayBuffer(): Promise<ArrayBuffer>
  exists(): Promise<boolean>
}

interface Bun {
  /** Absolute path of the running script's directory (Bun extension). */
  readonly file: (path: string | URL) => BunFile
  /** Write a file, creating parent directories as needed (Bun extension). */
  write: (dest: string | URL, data: string | ArrayBufferView | ArrayBufferLike) => Promise<number>
  readonly env: Record<string, string | undefined>
}

declare const Bun: Bun

interface ImportMeta {
  /** Absolute path of the running module's directory (Bun extension). */
  readonly dir: string
  readonly main: string
}
