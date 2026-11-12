declare module "bun:sqlite" {
  export class Database {
    constructor(path: string, opts?: { readonly?: boolean })
    exec(sql: string): void
    query(sql: string): { get(...args: any[]): any; all(...args: any[]): any[]; run(...args: any[]): any }
    close(): void
  }
}
