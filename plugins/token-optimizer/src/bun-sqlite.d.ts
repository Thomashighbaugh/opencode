declare module "bun:sqlite" {
  export class Database {
    constructor(path: string, options?: { readonly?: boolean; create?: boolean })
    exec(sql: string): void
    run(sql: string, ...params: unknown[]): { changes: number; lastInsertRowid: number | bigint }
    query(sql: string): {
      get(...params: unknown[]): unknown
      all(...params: unknown[]): unknown[]
      run(...params: unknown[]): { changes: number; lastInsertRowid: number | bigint }
    }
    close(): void
  }
}
