# Awesome Flat-Rate LLM APIs (research snapshot)

Source: https://github.com/ankita37105/awesome-flat-rate-llm-apis (checked 2026-10-26)

## Multi-provider flat-rate APIs

| Provider | Price | Metering | Models | Notes |
|---|---|---|---|---|
| APIClaw | $19-$129/mo | Request quota (500-8000/day), weighted by model | Claude, GPT, Gemini, DeepSeek, Qwen, Kimi, GLM, Grok etc. | Crypto (NOWPayments), free trial 50 req |
| OpenLimits | €10/24h, €45/week, €120/mo, €299/mo | Fair-use ceiling ($2000/day on most), Ultimate no daily ceiling | Claude, GPT-6 family, GLM, MiniMax, DeepSeek | Stripe |
| Standard Compute | $19-$249 individual, $499-$2499 teams | Compute budget drawn at per-token rates, stops at budget | Anthropic/OpenAI/Google + open-weight models | Stripe, larger first-month budget |
| Electron Hub | $10-$249/mo | Weekly credits ($8-$200), regenerate Sunday 21:00 UTC | 600+ models, 150+ premium | Creem/lava.top/Ko-fi, annual -20% |

## Open-model subscriptions

| Provider | Price | Metering | Models | Notes |
|---|---|---|---|---|
| Synthetic | $9/$30/$90/mo | Weekly credit limit (regen 2% every 202 min), extra at API rates | Open-weight (GLM, Kimi, DeepSeek, Qwen, gpt-oss) | |
| OpenCode Go | $10/$40/mo | Rolling 5h + monthly $ limit per model | Curated coding models | Works in OpenCode and other agents |

## Vendor coding subscriptions

| Plan | Price | Metering | Notes |
|---|---|---|---|
| Claude Pro/Max/Ultra | Pro $20/mo ($17 annual), Max 5x $100, Max 20x/Ultra $200 | 5h rolling + weekly limits | Claude Code included, API credits on Max/Ultra |
| GLM Coding Plan (Z.ai) | From $18/mo | Plan allowance | Works with Claude Code, Cline, Kilo, OpenCode etc. |

## Pay-per-token (comparison)

OpenRouter, Requesty, Anthropic API, OpenAI API - charged by tokens with fees/markups.

## Notes
- "Flat-rate" almost never means unlimited; check quotas/fair-use/credits.
- For coding agents, request-weighted or compute-budget plans are common.
- Use cost calculator: https://ankita37105.github.io/llm-api-cost-notes/calculator.html
