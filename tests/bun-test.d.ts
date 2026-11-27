/**
 * Ambient types for `bun:test`.
 *
 * The plugin tests run under bun (`bun test plugins/<name>/test/`), but the
 * repo typechecks with `tsc` and the `types` array only loads `node`. Without
 * this declaration every `import ... from "bun:test"` is a TS2307 error.
 *
 * The exports are intentionally `any`: the goal is to stop the module from
 * being "unresolved", not to re-implement bun's matcher typings. Runtime
 * correctness is enforced by bun, which is the runner that actually executes
 * these suites.
 */
declare module "bun:test" {
  export const describe: any
  export const test: any
  export const it: any
  export const expect: any
  export const beforeAll: any
  export const afterAll: any
  export const beforeEach: any
  export const afterEach: any
  export const mock: any
  export const jest: any
  export const spyOn: any
}
