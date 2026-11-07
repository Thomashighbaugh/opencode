/**
 * guard.ts — decides when a bash command should be rejected in favour of ax.
 *
 * Pure string matching, no host imports, so it is unit-testable and cheap to
 * run on every tool call. The point is not to ban curl outright (WebSocket and
 * streaming cases need it) but to stop the default "curl, then parse it with a
 * throwaway python script" path that costs an inference round-trip per probe.
 */

const HTTP = /\bhttps?:\/\//

const MESSAGE = [
  "Use ax instead of curl/python for HTTP.",
  "  ax URL --body          JSON payload alone (TOON-compacted)",
  "  ax URL --md            readable page",
  "  ax URL --outline       structure probe; then --locate <text>",
  "  ax URL '.sel' --row 'a=a, b=a@href'   structured extraction",
  "curl is only for WebSocket/streaming or curl-only flags — say which and why.",
].join("\n")

function basename(token: string): string {
  return token.replace(/^.*\//, "")
}

export function axGuard(command: string): string | null {
  if (!command || !HTTP.test(command)) return null

  // A curl/wget segment anywhere in the command (after ;, &&, ||, |, or start).
  const segment = /(?:^|[;&|]\s*)(?:sudo\s+)?([^\s;&|]+)/g
  let match: RegExpExecArray | null
  while ((match = segment.exec(command)) !== null) {
    const name = basename(match[1]!)
    if (name === "curl" || name === "wget") return MESSAGE
  }

  // Throwaway HTTP parsers: python -c / python - <<PY that pull a URL.
  if (/\bpython(?:3(?:\.\d+)?)?\s+(?:-c\b|-\s*<<)/.test(command)) {
    if (/\b(urllib|urlopen|requests|httpx|http\.client|aiohttp|BeautifulSoup|bs4|lxml|html\.parser)\b/.test(command)) {
      return MESSAGE
    }
  }

  // Node one-liners doing the same thing.
  if (/\bnode\s+(?:-e|--eval)\b/.test(command)) {
    if (/\b(?:fetch|https?\.get|axios|cheerio|jsdom)\b/.test(command)) return MESSAGE
  }

  return null
}
