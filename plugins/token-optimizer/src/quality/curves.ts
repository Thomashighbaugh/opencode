type Point = [number, number]

const ANTHROPIC: Point[] = [
  [0, 98], [0.1, 96], [0.25, 93], [0.5, 88], [0.6, 84],
  [0.7, 80], [0.8, 78], [0.9, 77], [1, 76],
]
const GPT55: Point[] = [
  [0, 98], [8_000, 98], [16_000, 96], [32_000, 94], [64_000, 90],
  [128_000, 86], [256_000, 84], [512_000, 81], [1_000_000, 74],
]
const GPT5: Point[] = [
  [0, 98], [32_000, 94], [64_000, 90], [128_000, 85], [256_000, 80],
  [512_000, 72], [1_000_000, 64],
]
const GPT41: Point[] = [
  [0, 98], [32_000, 95], [64_000, 92], [128_000, 88], [256_000, 82],
  [512_000, 74], [1_000_000, 66],
]
const GEMINI: Point[] = [
  [0, 98], [8_000, 97], [32_000, 95], [64_000, 92], [128_000, 85],
  [256_000, 72], [512_000, 50], [1_000_000, 26], [2_000_000, 15],
]

function interpolate(curve: Point[], x: number): number {
  if (curve.length === 0) return 76
  if (x <= curve[0][0]) return curve[0][1]
  if (x >= curve[curve.length - 1][0]) return curve[curve.length - 1][1]
  for (let i = 1; i < curve.length; i++) {
    if (x <= curve[i][0]) {
      const [x0, y0] = curve[i - 1]
      const [x1, y1] = curve[i]
      const t = (x - x0) / (x1 - x0)
      return y0 + t * (y1 - y0)
    }
  }
  return curve[curve.length - 1][1]
}

type Curve = { family: string; curve: Point[]; mode: "fill" | "tokens" }

function select(model?: string): Curve {
  const m = (model ?? "").toLowerCase()
  if (m.includes("gemini")) return { family: "google-gemini", curve: GEMINI, mode: "tokens" }
  if (m.includes("gpt-5.5") || m.includes("gpt-5.4")) return { family: "openai-gpt-5.5", curve: GPT55, mode: "tokens" }
  if (m.includes("gpt-4.1")) return { family: "openai-gpt-4.1", curve: GPT41, mode: "tokens" }
  if (m.includes("gpt-5") || m.includes("gpt-4")) return { family: "openai-gpt-5", curve: GPT5, mode: "tokens" }
  return { family: "anthropic-default", curve: ANTHROPIC, mode: "fill" }
}

export function estimateQualityFromFill(
  fillPct: number,
  model?: string,
  contextWindow?: number,
): { quality: number; curveName: string } {
  const fill = Math.max(0, Math.min(1, fillPct))
  const { family, curve, mode } = select(model)
  const quality = mode === "tokens" && contextWindow
    ? interpolate(curve, fill * contextWindow)
    : interpolate(curve, fill)
  return { quality: Math.round(quality), curveName: family }
}
