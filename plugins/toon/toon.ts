/**
 * toon.ts — self-contained TOON encoder/decoder.
 *
 * TOON (Token-Oriented Object Notation) is a JSON-compatible, indentation-based
 * encoding that is cheaper than JSON for tabular data. This module implements a
 * deliberately conservative subset, with one hard rule: nothing is emitted that
 * this decoder cannot reconstruct exactly. Callers must treat `encode()` as
 * "best effort" and verify with `roundTrips()` before replacing JSON.
 *
 * Subset:
 *   key: value                     object entry (nested objects indent by 2)
 *   key[N]: a<TAB>b<TAB>c          array of primitives
 *   key[N]{col1<TAB>col2}:         array of uniform objects (rows split by TAB)
 *   <TAB>1<TAB>2
 *   key[N]:                        heterogeneous array, one item per line
 *     -                             item: scalar, JSON scalar, or nested block
 *     - {}
 *   [N]{cols}: / [N]:              root-level arrays (same forms, no key)
 *
 * Everything unsupported makes `encode()` return null, which callers treat as
 * "keep the JSON". There is no partial or lossy output path.
 */

export const DELIMITER = "\t"
const INDENT = 2

const KEY_RE = /^[^\s:[\]{}\n\r\t]+$/
const NUMERIC_RE = /^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isPrimitive(value: unknown) {
  return value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean"
}

/** Encode a primitive as a TOON scalar, or null when it cannot be represented. */
export function encodeScalar(value: unknown): string | null {
  if (value === null) return "null"
  if (typeof value === "boolean") return value ? "true" : "false"
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null
    return JSON.stringify(value)
  }
  if (typeof value !== "string") return null
  if (value === "") return '""'
  if (value !== value.trim()) return JSON.stringify(value)
  if (/[\n\r\t]/.test(value)) return JSON.stringify(value)
  if (value === "true" || value === "false" || value === "null") return JSON.stringify(value)
  if (NUMERIC_RE.test(value)) return JSON.stringify(value)
  if (/^[["'{}\-]/.test(value)) return JSON.stringify(value)
  if (value.includes(DELIMITER) || value.includes(":") || value.includes(",")) return JSON.stringify(value)
  return value
}

function keysOf(records: Record<string, unknown>[]): string[] | null {
  const first = Object.keys(records[0]!)
  if (first.length === 0) return null
  if (!first.every((key) => KEY_RE.test(key))) return null
  for (const record of records) {
    const keys = Object.keys(record)
    if (keys.length !== first.length) return null
    if (!first.every((key, index) => keys[index] === key)) return null
  }
  return first
}

function pad(depth: number) {
  return " ".repeat(depth * INDENT)
}

function renderArray(label: string, value: readonly unknown[], depth: number): string[] | null {
  const head = `${pad(depth)}${label}[${value.length}]`

  if (value.length === 0) return [`${head}:`]

  if (value.every(isPrimitive)) {
    const scalars = value.map(encodeScalar)
    if (scalars.some((scalar) => scalar === null)) return null
    return [`${head}: ${scalars.join(DELIMITER)}`]
  }

  if (value.every(isRecord)) {
    const keys = keysOf(value as Record<string, unknown>[])
    if (keys) {
      const rows: string[] = []
      for (const record of value as Record<string, unknown>[]) {
        const cells = keys.map((key) => encodeScalar(record[key]))
        if (cells.some((cell) => cell === null)) {
          rows.length = 0
          break
        }
        rows.push(`${pad(depth + 1)}${cells.join(DELIMITER)}`)
      }
      if (rows.length === value.length) return [`${head}{${keys.join(DELIMITER)}}:`, ...rows]
    }
  }

  const lines = [`${head}:`]
  for (const item of value) {
    if (isPrimitive(item)) {
      const scalar = encodeScalar(item)
      if (scalar === null) return null
      lines.push(`${pad(depth + 1)}- ${scalar}`)
      continue
    }
    if (isRecord(item)) {
      const nested = renderObject(item, depth + 2)
      if (!nested) return null
      lines.push(`${pad(depth + 1)}-`, ...nested)
      continue
    }
    // Arrays nested inside a heterogeneous list are emitted as a JSON scalar.
    // The decoder recognises a leading "[" / "{" and JSON-parses the item.
    try {
      lines.push(`${pad(depth + 1)}- ${JSON.stringify(item)}`)
    } catch {
      return null
    }
  }
  return lines
}

function renderObject(value: Record<string, unknown>, depth: number): string[] | null {
  const lines: string[] = []
  for (const [key, child] of Object.entries(value)) {
    if (!KEY_RE.test(key)) return null
    const line = `${pad(depth)}${key}:`

    if (isPrimitive(child)) {
      const scalar = encodeScalar(child)
      if (scalar === null) return null
      lines.push(`${line} ${scalar}`)
      continue
    }
    if (Array.isArray(child)) {
      const rendered = renderArray(key, child, depth)
      if (!rendered) return null
      lines.push(...rendered)
      continue
    }
    if (isRecord(child)) {
      if (Object.keys(child).length === 0) {
        lines.push(`${line} {}`)
        continue
      }
      const nested = renderObject(child, depth + 1)
      if (!nested) return null
      lines.push(line, ...nested)
      continue
    }
    return null
  }
  return lines
}

/** Encode JSON-compatible data as TOON. Returns null when unsupported. */
export function encode(value: unknown): string | null {
  if (Array.isArray(value)) {
    const rendered = renderArray("", value, 0)
    return rendered ? rendered.join("\n") : null
  }
  if (isRecord(value)) {
    if (Object.keys(value).length === 0) return "{}"
    const rendered = renderObject(value, 0)
    return rendered ? rendered.join("\n") : null
  }
  return null
}

// ─── Decoder ────────────────────────────────────────────────────────────────

function indentOf(line: string) {
  let count = 0
  while (count < line.length && line[count] === " ") count++
  return count
}

function decodeScalar(text: string): unknown {
  const value = text.trim()
  if (value === "true") return true
  if (value === "false") return false
  if (value === "null") return null
  if (value.startsWith('"')) return JSON.parse(value)
  if (NUMERIC_RE.test(value)) return Number(value)
  return value
}

type Cursor = { lines: string[]; index: number }

function readList(cursor: Cursor, depth: number, count: number): unknown[] {
  const items: unknown[] = []
  while (items.length < count) {
    const line = cursor.lines[cursor.index]
    if (line === undefined) throw new Error("unexpected end of list")
    if (indentOf(line) !== depth + INDENT) throw new Error("bad list indentation")
    const body = line.slice(depth + INDENT)
    if (!body.startsWith("-")) throw new Error("expected list item")
    const rest = body.slice(1).trim()
    cursor.index++
    if (rest === "") {
      items.push(readBlock(cursor, depth + INDENT * 2))
      continue
    }
    if (rest.startsWith("[") || rest.startsWith("{")) {
      items.push(JSON.parse(rest))
      continue
    }
    items.push(decodeScalar(rest))
  }
  return items
}

function readRows(cursor: Cursor, depth: number, count: number, columns: string[]): unknown[] {
  const rows: unknown[] = []
  while (rows.length < count) {
    const line = cursor.lines[cursor.index]
    if (line === undefined) throw new Error("unexpected end of table")
    if (indentOf(line) !== depth + INDENT) throw new Error("bad row indentation")
    const cells = line.trim().split(DELIMITER)
    if (cells.length !== columns.length) throw new Error("column count mismatch")
    const record: Record<string, unknown> = {}
    columns.forEach((column, index) => {
      record[column] = decodeScalar(cells[index]!)
    })
    rows.push(record)
    cursor.index++
  }
  return rows
}

const ENTRY_RE = /^([^\s:[\]{}]+)(?:\[(\d+)\])?(?:\{([^}]*)\})?:(.*)$/

function readEntry(cursor: Cursor, depth: number, key: string, count?: number, columns?: string[], rest = ""): unknown {
  if (count === undefined) {
    if (rest.trim() === "{}") return {}
    if (rest.trim() === "") return readBlock(cursor, depth + INDENT)
    return decodeScalar(rest)
  }
  if (columns) return readRows(cursor, depth, count, columns)
  if (rest.trim() !== "") {
    const cells = rest.trim().split(DELIMITER)
    if (cells.length !== count) throw new Error("inline array length mismatch")
    return cells.map(decodeScalar)
  }
  return readList(cursor, depth, count)
}

function readBlock(cursor: Cursor, depth: number): unknown {
  const first = cursor.lines[cursor.index]
  if (first === undefined) throw new Error("unexpected end of input")

  const root = /^\[(\d+)\](?:\{([^}]*)\})?:(.*)$/.exec(first.slice(depth))
  if (root && indentOf(first) === depth) {
    cursor.index++
    const count = Number(root[1])
    const columns = root[2] === undefined ? undefined : root[2].split(DELIMITER)
    return readEntry(cursor, depth, "", count, columns, root[3])
  }

  const record: Record<string, unknown> = {}
  while (cursor.index < cursor.lines.length) {
    const line = cursor.lines[cursor.index]!
    const indent = indentOf(line)
    if (indent < depth) break
    if (indent > depth) throw new Error("unexpected indentation")
    const body = line.slice(depth)
    if (body.startsWith("-")) break
    const match = ENTRY_RE.exec(body)
    if (!match) throw new Error(`unparseable entry: ${body}`)
    const [, key, count, columns, rest] = match
    cursor.index++
    const value = readEntry(
      cursor,
      depth,
      key!,
      count === undefined ? undefined : Number(count),
      columns === undefined ? undefined : columns.split(DELIMITER),
      rest ?? "",
    )
    record[key!] = value
  }
  return record
}

/** Decode TOON into JSON-compatible data. Throws on malformed input. */
export function decode(text: string): unknown {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+$/, ""))
    .filter((line) => line.trim() !== "")
  if (lines.length === 0) throw new Error("empty document")
  if (lines.length === 1 && lines[0]!.trim() === "{}") return {}
  if (indentOf(lines[0]!) !== 0) throw new Error("document must start at column 0")
  const cursor: Cursor = { lines, index: 0 }
  const value = readBlock(cursor, 0)
  if (cursor.index !== lines.length) throw new Error("trailing input")
  return value
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical)
  if (isRecord(value)) {
    const out: Record<string, unknown> = {}
    for (const key of Object.keys(value).sort()) out[key] = canonical(value[key])
    return out
  }
  return value
}

/** True when `decode(encode(value))` reproduces `value` exactly (JSON semantics). */
export function roundTrips(value: unknown): boolean {
  const text = encode(value)
  if (text === null) return false
  try {
    return JSON.stringify(canonical(decode(text))) === JSON.stringify(canonical(value))
  } catch {
    return false
  }
}

/**
 * Encode only when the result is shorter than the JSON source and survives a
 * round trip. Returns null otherwise — the caller keeps the JSON.
 */
export function toonify(jsonText: string): string | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    return null
  }
  if (!roundTrips(parsed)) return null
  const encoded = encode(parsed)
  if (encoded === null || encoded.length >= jsonText.length) return null
  return encoded
}
