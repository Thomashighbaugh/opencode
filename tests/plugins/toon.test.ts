import { describe, expect, test } from "vitest"

import { decode, encode, roundTrips, toonify } from "../../plugins/toon/toon"

const tabular = {
  issues: [
    { id: 1, title: "Found a bug", state: "open" },
    { id: 2, title: "Docs update", state: "open" },
    { id: 3, title: "Ship release", state: "closed" },
  ],
}

describe("encode", () => {
  test("emits a tabular array for uniform records", () => {
    expect(encode(tabular)).toBe(
      [
        "issues[3]{id\ttitle\tstate}:",
        "  1\tFound a bug\topen",
        "  2\tDocs update\topen",
        "  3\tShip release\tclosed",
      ].join("\n"),
    )
  })

  test("emits inline primitive arrays", () => {
    expect(encode({ tags: ["a", "b", "c"] })).toBe("tags[3]: a\tb\tc")
  })

  test("nests objects by indentation", () => {
    expect(encode({ a: { b: { c: 1 } } })).toBe(["a:", "  b:", "    c: 1"].join("\n"))
  })

  test("uses list form for heterogeneous arrays", () => {
    expect(encode({ mix: [1, { a: 2 }, [3]] })).toBe(
      ["mix[3]:", "  - 1", "  -", "    a: 2", "  - [3]"].join("\n"),
    )
  })

  test("quotes scalars that would be misread", () => {
    const value = { s: "true", n: "12", colon: "a: b", multi: "x\ny", spaced: " pad " }
    expect(encode(value)).not.toBeNull()
    expect(roundTrips(value)).toBe(true)
  })

  test("refuses keys outside the subset instead of guessing", () => {
    expect(encode({ "bad key": 1 })).toBeNull()
    expect(encode({ "a:b": 1 })).toBeNull()
  })

  test("handles empty containers", () => {
    expect(encode({ empty: [], none: {} })).toBe(["empty[0]:", "none: {}"].join("\n"))
    expect(roundTrips({ empty: [], none: {} })).toBe(true)
  })

  test("encodes root arrays", () => {
    expect(encode([{ a: 1 }, { a: 2 }])).toBe(["[2]{a}:", "  1", "  2"].join("\n"))
    expect(roundTrips([{ a: 1 }, { a: 2 }])).toBe(true)
  })
})

describe("decode", () => {
  test("round-trips every supported shape", () => {
    const values: unknown[] = [
      tabular,
      { tags: ["a", "b"] },
      { a: { b: { c: [1, 2, 3] } } },
      { mix: [1, "two", null, true, { deep: 1 }] },
      [[1, 2], [3, 4]],
      [],
      {},
      { unicode: "héllo — 世界", quote: 'he said "hi"', backslash: "a\\b" },
    ]
    for (const value of values) {
      expect(roundTrips(value), JSON.stringify(value)).toBe(true)
    }
  })

  test("rejects malformed input", () => {
    expect(() => decode("  key: 1")).toThrow()
    expect(() => decode("key[2]: a")).toThrow()
    expect(() => decode("key[1]{a\tb}:\n\t1\t2")).toThrow()
    expect(() => decode("key: 1\n  stray: 2")).toThrow()
  })

  test("property: random structures round-trip", () => {
    let seed = 42
    const random = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      return seed / 0x7fffffff
    }
    const key = (index: number) => `k${index}`
    const scalar = (): unknown => {
      const pick = Math.floor(random() * 5)
      if (pick === 0) return null
      if (pick === 1) return random() > 0.5
      if (pick === 2) return Math.floor(random() * 1000) - 500
      if (pick === 3) return `s${Math.floor(random() * 100)}`
      return "text with: colon, comma\ttab"
    }
    const value = (depth: number): unknown => {
      if (depth <= 0) return scalar()
      const pick = Math.floor(random() * 3)
      if (pick === 0) {
        const out: Record<string, unknown> = {}
        const count = 1 + Math.floor(random() * 3)
        for (let index = 0; index < count; index++) out[key(index)] = value(depth - 1)
        return out
      }
      if (pick === 1) {
        const out: Record<string, unknown>[] = []
        const count = Math.floor(random() * 4)
        const width = 1 + Math.floor(random() * 3)
        for (let index = 0; index < count; index++) {
          const row: Record<string, unknown> = {}
          for (let column = 0; column < width; column++) row[key(column)] = scalar()
          out.push(row)
        }
        return out
      }
      const out: unknown[] = []
      const count = Math.floor(random() * 4)
      for (let index = 0; index < count; index++) out.push(value(depth - 1))
      return out
    }
    for (let index = 0; index < 200; index++) {
      const subject = value(3)
      expect(roundTrips(subject), JSON.stringify(subject)).toBe(true)
    }
  })
})

describe("toonify", () => {
  test("returns null when the encoding is not shorter or unsupported", () => {
    expect(toonify(JSON.stringify({ "bad key": 1 }))).toBeNull()
    expect(toonify(JSON.stringify({ a: 1 }))).toBe("a: 1")
  })

  test("returns null for invalid JSON", () => {
    expect(toonify("not json")).toBeNull()
  })

  test("returns TOON when it is shorter", () => {
    const json = JSON.stringify(
      Array.from({ length: 50 }, (_, index) => ({ id: index, name: `row-${index}`, state: index % 2 ? "open" : "closed" })),
    )
    const toon = toonify(json)
    expect(toon).not.toBeNull()
    expect(toon!.length).toBeLessThan(json.length)
    expect(decode(toon!)).toEqual(JSON.parse(json))
  })
})
