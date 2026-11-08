/** Static, network-free pricing and context-window table. Rates are USD per 1M tokens. */

export type Rates = { input: number; output: number; cacheRead: number; cacheWrite: number }
export type ModelCard = Rates & { window: number }

export const MODELS: Record<string, ModelCard> = {
  "claude-opus-4-1": { input: 15, output: 75, cacheRead: 1.5, cacheWrite: 18.75, window: 200_000 },
  "claude-opus-4": { input: 15, output: 75, cacheRead: 1.5, cacheWrite: 18.75, window: 200_000 },
  "claude-sonnet-4": { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75, window: 200_000 },
  "claude-sonnet-5": { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5, window: 1_000_000 },
  "claude-haiku-4": { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25, window: 200_000 },
  "gpt-5.5": { input: 5, output: 20, cacheRead: 0.5, cacheWrite: 5, window: 1_000_000 },
  "gpt-5.5-pro": { input: 30, output: 120, cacheRead: 3, cacheWrite: 30, window: 1_000_000 },
  "gpt-5.4": { input: 2.5, output: 10, cacheRead: 0.25, cacheWrite: 2.5, window: 1_000_000 },
  "gpt-5.4-mini": { input: 0.75, output: 3, cacheRead: 0.075, cacheWrite: 0.75, window: 400_000 },
  "gpt-5.4-nano": { input: 0.2, output: 0.8, cacheRead: 0.02, cacheWrite: 0.2, window: 400_000 },
  "gpt-5.3-codex": { input: 1.75, output: 7, cacheRead: 0.175, cacheWrite: 1.75, window: 400_000 },
  "gpt-5.2": { input: 1.75, output: 7, cacheRead: 0.175, cacheWrite: 1.75, window: 400_000 },
  "gpt-5.1": { input: 1.25, output: 5, cacheRead: 0.125, cacheWrite: 1.25, window: 400_000 },
  "gpt-5": { input: 1.25, output: 5, cacheRead: 0.125, cacheWrite: 1.25, window: 400_000 },
  "gpt-4.1": { input: 2, output: 8, cacheRead: 0.5, cacheWrite: 2, window: 1_000_000 },
  "gpt-4.1-mini": { input: 0.4, output: 1.6, cacheRead: 0.1, cacheWrite: 0.4, window: 1_000_000 },
  "gpt-4.1-nano": { input: 0.1, output: 0.4, cacheRead: 0.025, cacheWrite: 0.1, window: 1_000_000 },
  "gemini-2.5-pro": { input: 1.25, output: 10, cacheRead: 0.31, cacheWrite: 1.25, window: 2_000_000 },
  "gemini-2.5-flash": { input: 0.3, output: 2.5, cacheRead: 0.075, cacheWrite: 0.3, window: 1_000_000 },
  "gemini-2.5-flash-lite": { input: 0.1, output: 0.4, cacheRead: 0.025, cacheWrite: 0.1, window: 1_000_000 },
  "gemini-3-pro": { input: 2, output: 12, cacheRead: 0.5, cacheWrite: 2, window: 2_000_000 },
  "deepseek-chat": { input: 0.27, output: 1.1, cacheRead: 0.07, cacheWrite: 0.27, window: 128_000 },
  "deepseek-reasoner": { input: 0.55, output: 2.19, cacheRead: 0.14, cacheWrite: 0.55, window: 128_000 },
  "qwen3-coder": { input: 0.4, output: 1.6, cacheRead: 0.1, cacheWrite: 0.4, window: 128_000 },
  "mistral-large": { input: 2, output: 6, cacheRead: 0.5, cacheWrite: 2, window: 128_000 },
  "grok-4": { input: 3, output: 15, cacheRead: 0.75, cacheWrite: 3, window: 256_000 },
  "grok-code": { input: 1.5, output: 7.5, cacheRead: 0.375, cacheWrite: 1.5, window: 256_000 },
  "o3": { input: 2, output: 8, cacheRead: 0.5, cacheWrite: 2, window: 200_000 },
  "o4-mini": { input: 1.1, output: 4.4, cacheRead: 0.275, cacheWrite: 1.1, window: 200_000 },
}

const DEFAULT_WINDOW = 200_000

export function stripModelDecorations(model: string): string {
  return model
    .toLowerCase()
    .replace(/^[a-z0-9_-]+\//, "")
    .replace(/@[a-z0-9._-]+$/i, "")
    .trim()
}

export function pricingKey(model?: string): string | null {
  if (!model) return null
  const raw = stripModelDecorations(model)
  if (MODELS[raw]) return raw
  const candidates = Object.keys(MODELS).sort((a, b) => b.length - a.length)
  for (const key of candidates) {
    if (raw.includes(key)) return key
  }
  if (raw.includes("sonnet")) return "claude-sonnet-5"
  if (raw.includes("opus")) return "claude-opus-4-1"
  if (raw.includes("haiku")) return "claude-haiku-4"
  if (raw.includes("gemini")) return "gemini-2.5-pro"
  if (raw.includes("deepseek")) return "deepseek-chat"
  if (raw.includes("grok")) return "grok-4"
  return null
}

export function contextWindowForModel(model?: string): number {
  const key = pricingKey(model)
  return key ? MODELS[key].window : DEFAULT_WINDOW
}

export function ratesFor(model?: string): Rates {
  const key = pricingKey(model)
  const card = key ? MODELS[key] : undefined
  const fallback = MODELS["claude-sonnet-4"]
  const r = card ?? fallback
  return { input: r.input / 1e6, output: r.output / 1e6, cacheRead: r.cacheRead / 1e6, cacheWrite: r.cacheWrite / 1e6 }
}

export function costOf(
  model: string | undefined,
  usage: { input: number; output: number; cacheRead: number; cacheWrite: number },
): number {
  const r = ratesFor(model)
  return usage.input * r.input + usage.output * r.output + usage.cacheRead * r.cacheRead + usage.cacheWrite * r.cacheWrite
}
