import { describe, expect, test } from "bun:test"
import { estimateQualityFromFill } from "../src/quality/curves.ts"
import { contextWindowForModel, pricingKey, ratesFor, MODELS, stripModelDecorations } from "../src/pricing/table.ts"
import { redact, scrubControl } from "../src/redact.ts"
import { words, round1, percent, formatTokens, truncate, safePath, oneLine } from "../src/text.ts"

describe("pricing - model normalization", () => {
  test("strips provider prefixes", () => {
    expect(pricingKey("openrouter/anthropic/claude-sonnet-4")).toBe("claude-sonnet-4")
    expect(pricingKey("claude-sonnet-4@vendor")).toBe("claude-sonnet-4")
  })

  test("returns null for unknown model", () => {
    expect(pricingKey("made-up-model-xyz")).toBeNull()
    expect(pricingKey(undefined)).toBeNull()
  })

  test("family fallback heuristics", () => {
    expect(pricingKey("claude-sonnet-4-custom")).toBe("claude-sonnet-4")
    expect(pricingKey("claude-opus-4-custom")).toBe("claude-opus-4")
    expect(pricingKey("claude-haiku-4-custom")).toBe("claude-haiku-4")
    expect(pricingKey("gemini-2.5-pro-custom")).toBe("gemini-2.5-pro")
    expect(pricingKey("deepseek-chat-custom")).toBe("deepseek-chat")
    expect(pricingKey("grok-4-custom")).toBe("grok-4")
  })

  test("stripModelDecorations normalizes case and removes single prefix", () => {
    expect(stripModelDecorations("claude-sonnet-4")).toBe("claude-sonnet-4")
    expect(stripModelDecorations("claude-sonnet-4@openrouter")).toBe("claude-sonnet-4")
  })

  test("all MODELS have positive rates and windows", () => {
    for (const [key, card] of Object.entries(MODELS)) {
      expect(card.input).toBeGreaterThan(0)
      expect(card.output).toBeGreaterThan(0)
      expect(card.window).toBeGreaterThan(0)
      expect(key).toBe(key.toLowerCase())
    }
  })
})

describe("pricing - context window and rates", () => {
  test("contextWindowForModel resolves known windows", () => {
    expect(contextWindowForModel("claude-sonnet-4")).toBe(200_000)
    expect(contextWindowForModel("gpt-5.4")).toBe(1_000_000)
    expect(contextWindowForModel("gemini-2.5-pro")).toBe(2_000_000)
    expect(contextWindowForModel("unknown-model")).toBe(200_000)
    expect(contextWindowForModel(undefined)).toBe(200_000)
  })

  test("ratesFor returns per-token rates", () => {
    const r = ratesFor("claude-sonnet-4")
    expect(r.input).toBeCloseTo(3 / 1e6, 10)
    expect(r.output).toBeCloseTo(15 / 1e6, 10)
    expect(r.cacheRead).toBeCloseTo(0.3 / 1e6, 10)
    expect(r.cacheWrite).toBeCloseTo(3.75 / 1e6, 10)
  })

  test("ratesFor falls back to claude-sonnet-4", () => {
    const r = ratesFor("unknown-model")
    const fb = ratesFor("claude-sonnet-4")
    expect(r.input).toBe(fb.input)
  })
})

describe("curves - estimateQualityFromFill", () => {
  test("anthropic curve stays in documented band", () => {
    expect(estimateQualityFromFill(0, "claude-sonnet-4", 200_000).quality).toBe(98)
    expect(estimateQualityFromFill(1, "claude-sonnet-4", 200_000).quality).toBe(76)
    expect(estimateQualityFromFill(0.5, "claude-sonnet-4", 200_000).quality).toBeLessThan(90)
  })

  test("gemini uses token mode with contextWindow", () => {
    const q = estimateQualityFromFill(0.5, "gemini-2.5-pro", 2_000_000)
    expect(q.quality).toBeGreaterThan(0)
    expect(q.quality).toBeLessThanOrEqual(100)
    expect(q.curveName).toContain("gemini")
  })

  test("gpt-5 uses token mode", () => {
    const q = estimateQualityFromFill(0.5, "gpt-5", 1_000_000)
    expect(q.curveName).toContain("openai")
  })

  test("clamps fillPct to [0,1]", () => {
    const low = estimateQualityFromFill(-1, "claude-sonnet-4", 200_000)
    const high = estimateQualityFromFill(2, "claude-sonnet-4", 200_000)
    expect(low.quality).toBe(98)
    expect(high.quality).toBe(76)
  })

  test("returns curveName", () => {
    const q = estimateQualityFromFill(0.3, "claude-sonnet-4", 200_000)
    expect(typeof q.curveName).toBe("string")
    expect(q.curveName.length).toBeGreaterThan(0)
  })
})

describe("redact", () => {
  test("redacts OpenAI-style keys", () => {
    expect(redact("sk-abcdefghijklmnopqrstuvwxyz")).toContain("[REDACTED_KEY]")
    expect(redact("sk-abcdefghijklmnopqrstuvwxyz")).not.toContain("sk-abcdefghijklmnopqrstuvwxyz")
  })

  test("redacts GitHub tokens", () => {
    expect(redact("ghp_abcdefghijklmnopqrst")).toContain("[REDACTED_TOKEN]")
  })

  test("redacts AWS keys", () => {
    expect(redact("AKIAIOSFODNN7EXAMPLE")).toContain("[REDACTED_KEY]")
  })

  test("redacts bearer tokens", () => {
    expect(redact("Bearer abcdefghijklmnopqrstuvwxyz")).toContain("[REDACTED]")
  })

  test("redacts private keys", () => {
    const pem = "-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA\n-----END RSA PRIVATE KEY-----"
    const redacted = redact(pem)
    expect(redacted).toContain("[REDACTED_PRIVATE_KEY]")
    expect(redacted).not.toContain("MIIEpAIBAAKCAQEA")
  })

  test("redacts password assignments", () => {
    expect(redact('password = "supersecret123"')).toContain("[REDACTED]")
    expect(redact("api_key=sk-1234567890")).toContain("[REDACTED]")
  })

  test("does not redact normal text", () => {
    expect(redact("hello world, nothing secret here")).toBe("hello world, nothing secret here")
  })
})

describe("scrubControl", () => {
  test("removes control characters", () => {
    expect(scrubControl("a\u0000b\u0001c")).toBe("a b c")
    expect(scrubControl("hello\nworld")).toBe("hello\nworld") // \n is not in control range removed
  })

  test("preserves printable text", () => {
    expect(scrubControl("normal text")).toBe("normal text")
  })
})

describe("text utilities", () => {
  test("words counts", () => {
    expect(words("one two three")).toBe(3)
    expect(words("")).toBe(0)
    expect(words("   ")).toBe(0)
  })

  test("round1", () => {
    expect(round1(1.25)).toBe(1.3)
    expect(round1(1.24)).toBe(1.2)
    expect(round1(0)).toBe(0)
  })

  test("percent", () => {
    expect(percent(0.85)).toBe("85%")
    expect(percent(0.5)).toBe("50%")
  })

  test("formatTokens", () => {
    expect(formatTokens(500)).toBe("500")
    expect(formatTokens(1500)).toBe("2K")
    expect(formatTokens(1_500_000)).toBe("1.5M")
  })

  test("truncate adds marker and does not break surrogate pairs", () => {
    const text = "👍 hello world"
    const t = truncate(text, 5)
    expect(t.endsWith("[... truncated]")).toBe(true)
    // The part before the marker should not end with a high surrogate
    const beforeMarker = t.slice(0, t.length - "[... truncated]".length)
    const lastCode = beforeMarker.charCodeAt(beforeMarker.length - 1)
    expect(lastCode < 0xd800 || lastCode > 0xdfff).toBe(true)
  })

  test("safePath removes dangerous chars but keeps path separators", () => {
    expect(safePath("../etc/passwd; rm -rf /")).toContain("etc/passwd")
    expect(safePath("../etc/passwd; rm -rf /")).not.toContain(";")
    expect(safePath("src/auth.ts")).toBe("src/auth.ts")
  })

  test("oneLine collapses newlines to spaces", () => {
    expect(oneLine("hello\n  world\tfoo")).toBe("hello   world\tfoo")
  })
})
