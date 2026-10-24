import { tool } from "@opencode-ai/plugin"

// ─── Constants ──────────────────────────────────────────────────────────

const DEFAULT_ENDPOINT = process.env.SEARXNG_URL || "http://localhost:8080"
const DEFAULT_TIMEOUT_MS = 15_000
const MAX_PAGES = 10
const MAX_CONCURRENCY = 8
const RRF_K = 60

const TRACKING_PARAMS = new Set([
  "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
  "fbclid", "gclid", "ref", "ref_src", "spm", "mc_cid", "mc_eid",
])

// ─── Types ──────────────────────────────────────────────────────────────

type RawResult = {
  url?: string
  title?: string
  content?: string
  engine?: string
  engines?: string[]
  score?: number
  publishedDate?: string
}

type Merged = {
  url: string
  title: string
  content: string
  engines: Set<string>
  queries: Set<string>
  publishedDate?: string
  score: number
}

// ─── URL Normalization ──────────────────────────────────────────────────

function normalizeUrl(raw: string): string {
  try {
    const url = new URL(raw)
    url.hash = ""
    for (const key of [...url.searchParams.keys()]) {
      if (TRACKING_PARAMS.has(key.toLowerCase())) url.searchParams.delete(key)
    }
    let out = url.toString()
    if (out.endsWith("/")) out = out.slice(0, -1)
    return out.toLowerCase()
  } catch {
    return raw.trim().toLowerCase().replace(/\/+$/, "")
  }
}

// ─── Concurrency ────────────────────────────────────────────────────────

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const out = new Array<R>(items.length)
  let cursor = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    for (;;) {
      const index = cursor++
      if (index >= items.length) return
      out[index] = await fn(items[index], index)
    }
  })
  await Promise.all(workers)
  return out
}

// ─── Engine Catalog ─────────────────────────────────────────────────────

type EngineInfo = { name: string; enabled: boolean }

const configCache = new Map<string, { at: number; engines: EngineInfo[] }>()
const CONFIG_TTL_MS = 10 * 60_000

async function getEngineCatalog(endpoint: string): Promise<EngineInfo[] | null> {
  const hit = configCache.get(endpoint)
  if (hit && Date.now() - hit.at < CONFIG_TTL_MS) return hit.engines
  try {
    const res = await fetch(new URL("/config", endpoint), {
      signal: AbortSignal.timeout(5000),
      headers: { accept: "application/json" },
    })
    if (!res.ok) return null
    const body = (await res.json()) as { engines?: Array<{ name?: unknown; enabled?: unknown }> }
    const engines = (body.engines ?? [])
      .map(e => ({ name: String(e?.name ?? ""), enabled: Boolean(e?.enabled) }))
      .filter(e => e.name.length > 0)
    if (engines.length === 0) return null
    configCache.set(endpoint, { at: Date.now(), engines })
    return engines
  } catch {
    return null
  }
}

// ─── Single Request ─────────────────────────────────────────────────────

type FetchOutcome =
  | {
      ok: true
      results: RawResult[]
      engines: string[]
      unresponsive: Array<[string, string]>
      suggestions: string[]
    }
  | { ok: false; error: string }

async function fetchPage(
  endpoint: string,
  query: string,
  page: number,
  opts: {
    engines?: string[]
    categories?: string[]
    language?: string
    timeRange?: string
    safesearch?: number
    timeoutMs: number
  },
): Promise<FetchOutcome> {
  const url = new URL("/search", endpoint)
  url.searchParams.set("q", query)
  url.searchParams.set("format", "json")
  url.searchParams.set("pageno", String(page))
  if (opts.engines?.length) url.searchParams.set("engines", opts.engines.join(","))
  if (opts.categories?.length) url.searchParams.set("categories", opts.categories.join(","))
  if (opts.language) url.searchParams.set("language", opts.language)
  if (opts.timeRange) url.searchParams.set("time_range", opts.timeRange)
  if (opts.safesearch !== undefined) url.searchParams.set("safesearch", String(opts.safesearch))

  let lastError = "unknown error"
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) await new Promise(r => setTimeout(r, 400 * attempt))
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(opts.timeoutMs),
        headers: { accept: "application/json" },
      })
      if (!res.ok) {
        lastError = `HTTP ${res.status}`
        if (res.status >= 500 || res.status === 429) continue
        return { ok: false, error: lastError }
      }
      const body = (await res.json()) as {
        results?: RawResult[]
        unresponsive_engines?: unknown[]
        suggestions?: unknown[]
      }
      const results = Array.isArray(body.results) ? body.results : []
      const engines = [
        ...new Set(
          results.flatMap(r => (r.engines?.length ? r.engines : r.engine ? [r.engine] : [])),
        ),
      ]
      const unresponsive: Array<[string, string]> = Array.isArray(body.unresponsive_engines)
        ? body.unresponsive_engines
            .filter((e): e is [unknown, unknown] => Array.isArray(e) && e.length >= 1)
            .map(e => [String(e[0] ?? ""), String(e[1] ?? "unresponsive")] as [string, string])
            .filter(([name]) => name.length > 0)
        : []
      const suggestions = Array.isArray(body.suggestions)
        ? body.suggestions.filter((s): s is string => typeof s === "string" && s.trim().length > 0)
        : []
      return { ok: true, results, engines, unresponsive, suggestions }
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err)
    }
  }
  return { ok: false, error: lastError }
}

// ─── Ranking ────────────────────────────────────────────────────────────

function reciprocalRankFusion(lists: string[][]): Map<string, number> {
  const scores = new Map<string, number>()
  for (const list of lists) {
    list.forEach((url, index) => {
      scores.set(url, (scores.get(url) ?? 0) + 1 / (RRF_K + index + 1))
    })
  }
  return scores
}

// ─── Tool Export ────────────────────────────────────────────────────────

export default tool({
  description:
    "Multi-query web search against the local SearXNG instance with page-depth fan-out, URL dedupe, and reciprocal-rank fusion. " +
    "Unlike the searxng MCP tool (hard-capped at 20 results per call by its schema), this queries SearXNG's JSON API directly and can pull hundreds of results " +
    "across many queries and result pages in one call. Returns merged, deduped results plus coverage stats (raw vs unique vs returned, per-engine counts, failures, " +
    "and whether more results are available) so you can judge whether the result set is broad enough before concluding. " +
    "Use for: multi-angle research, breadth-first sweeps, 'find everything about X', competitive scans, and any task where a single 10-20 result page is too narrow. " +
    "Use the searxng MCP tool instead for one-off single lookups where a short answer suffices.",
  args: {
    query: tool.schema
      .string()
      .optional()
      .describe("A single search query. Mutually optional with `queries`; at least one is required."),
    queries: tool.schema
      .array(tool.schema.string())
      .optional()
      .describe("Multiple queries to fan out concurrently. Each gets its own result ranking."),
    pages: tool.schema
      .number()
      .int()
      .min(1)
      .max(MAX_PAGES)
      .optional()
      .describe(`Result pages to fetch per query (1-${MAX_PAGES}). Each page adds roughly 100 raw results. Default 1.`),
    numResults: tool.schema
      .number()
      .int()
      .min(1)
      .max(300)
      .optional()
      .describe("Maximum merged unique results to return. Default 40."),
    snippetChars: tool.schema
      .number()
      .int()
      .min(0)
      .optional()
      .describe("Trim each result's content to this many characters. 0 omits snippets entirely. Default 320."),
    engines: tool.schema
      .array(tool.schema.string())
      .optional()
      .describe("Restrict to specific SearXNG engines (e.g. ['google','bing','duckduckgo']). Omit to use all enabled engines."),
    categories: tool.schema
      .array(tool.schema.string())
      .optional()
      .describe("SearXNG categories (e.g. ['general','news','it','science'])."),
    language: tool.schema
      .string()
      .optional()
      .describe("Language code, e.g. 'en'. Defaults to the instance setting."),
    timeRange: tool.schema
      .enum(["day", "week", "month", "year"])
      .optional()
      .describe("Restrict results to a recency window."),
    safesearch: tool.schema
      .number()
      .int()
      .min(0)
      .max(2)
      .optional()
      .describe("0 = none, 1 = moderate, 2 = strict."),
    concurrency: tool.schema
      .number()
      .int()
      .min(1)
      .max(MAX_CONCURRENCY)
      .optional()
      .describe(`Parallel requests in flight (1-${MAX_CONCURRENCY}). Default 4.`),
    endpoint: tool.schema
      .string()
      .optional()
      .describe(`SearXNG base URL. Defaults to SEARXNG_URL or ${DEFAULT_ENDPOINT}.`),
    timeoutMs: tool.schema
      .number()
      .int()
      .min(1000)
      .optional()
      .describe(`Per-request timeout in milliseconds. Default ${DEFAULT_TIMEOUT_MS}.`),
  },
  async execute(args) {
    const started = Date.now()

    const queries = [...new Set(
      [...(args.queries ?? []), ...(args.query ? [args.query] : [])]
        .map(q => q.trim())
        .filter(Boolean),
    )]
    if (queries.length === 0) {
      return JSON.stringify({ ok: false, error: "Provide `query` or `queries`." })
    }

    const endpoint = (args.endpoint || DEFAULT_ENDPOINT).replace(/\/+$/, "")

    // SearXNG silently ignores unknown engine names, returning zero results with no
    // error. Reject them up front instead of reporting an empty result set.
    if (args.engines?.length) {
      const catalog = await getEngineCatalog(endpoint)
      if (catalog) {
        const enabled = catalog.filter(e => e.enabled).map(e => e.name)
        const enabledSet = new Set(enabled)
        const unknown = args.engines.filter(name => !enabledSet.has(name))
        if (unknown.length > 0) {
          const near = enabled.filter(name =>
            unknown.some(u => name.toLowerCase().includes(u.toLowerCase())),
          )
          return JSON.stringify({
            ok: false,
            error:
              `Unknown or disabled engine(s): ${unknown.join(", ")}. ` +
              "SearXNG ignores unknown engine names and returns zero results silently, so the search was not run.",
            ...(near.length ? { didYouMean: near.slice(0, 10) } : {}),
            availableEngines: enabled.slice(0, 80),
            enabledEngineCount: enabled.length,
          })
        }
      }
    }
    const pages = args.pages ?? 1
    const numResults = args.numResults ?? 40
    const snippetChars = args.snippetChars ?? 320
    const concurrency = args.concurrency ?? 4
    const timeoutMs = args.timeoutMs ?? DEFAULT_TIMEOUT_MS

    const tasks = queries.flatMap(query =>
      Array.from({ length: pages }, (_, i) => ({ query, page: i + 1 })),
    )

    const outcomes = await mapLimit(tasks, concurrency, async task =>
      fetchPage(endpoint, task.query, task.page, {
        engines: args.engines,
        categories: args.categories,
        language: args.language,
        timeRange: args.timeRange,
        safesearch: args.safesearch,
        timeoutMs,
      }).then(outcome => ({ ...task, outcome })),
    )

    const failures = outcomes
      .filter(o => !o.outcome.ok)
      .map(o => ({
        query: o.query,
        page: o.page,
        error: (o.outcome as { ok: false; error: string }).error,
      }))

    // A page can succeed while covering far less than the query deserves: engines
    // throttle or CAPTCHA out, and SearXNG reports that only in the payload. Surface
    // it so a thin result set is never mistaken for a complete one.
    const degraded = new Map<string, Set<string>>()
    const suggestions = new Set<string>()
    let emptyPages = 0
    for (const { outcome } of outcomes) {
      if (!outcome.ok) continue
      if (outcome.results.length === 0) emptyPages++
      for (const [name, reason] of outcome.unresponsive) {
        const reasons = degraded.get(name) ?? new Set<string>()
        reasons.add(reason)
        degraded.set(name, reasons)
      }
      for (const suggestion of outcome.suggestions) suggestions.add(suggestion.trim())
    }

    // Merge by normalized URL, preserving per-query rank lists for RRF.
    const merged = new Map<string, Merged>()
    const perQueryLists = new Map<string, string[]>()

    for (const { query, page, outcome } of outcomes) {
      if (!outcome.ok) continue
      const list = perQueryLists.get(query) ?? []
      for (const raw of outcome.results) {
        if (!raw.url) continue
        const key = normalizeUrl(raw.url)
        list.push(key)
        const existing = merged.get(key)
        const engines = raw.engines?.length ? raw.engines : raw.engine ? [raw.engine] : []
        if (existing) {
          for (const e of engines) existing.engines.add(e)
          existing.queries.add(query)
          if (!existing.content && raw.content) existing.content = raw.content
          if (!existing.publishedDate && raw.publishedDate) existing.publishedDate = raw.publishedDate
        } else {
          merged.set(key, {
            url: raw.url,
            title: (raw.title ?? "").trim(),
            content: raw.content ?? "",
            engines: new Set(engines),
            queries: new Set([query]),
            publishedDate: raw.publishedDate,
            score: 0,
          })
        }
      }
      perQueryLists.set(query, list)
    }

    const scores = reciprocalRankFusion([...perQueryLists.values()])
    for (const [key, entry] of merged) entry.score = scores.get(key) ?? 0

    const ranked = [...merged.values()].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      if (b.queries.size !== a.queries.size) return b.queries.size - a.queries.size
      return b.engines.size - a.engines.size
    })

    const returned = ranked.slice(0, numResults)
    const engineCounts: Record<string, number> = {}
    for (const entry of ranked) {
      for (const engine of entry.engines) engineCounts[engine] = (engineCounts[engine] ?? 0) + 1
    }

    const results = returned.map((entry, index) => ({
      rank: index + 1,
      title: entry.title,
      url: entry.url,
      ...(snippetChars > 0
        ? { snippet: entry.content.replace(/\s+/g, " ").slice(0, snippetChars) }
        : {}),
      ...(entry.publishedDate ? { publishedDate: entry.publishedDate } : {}),
      engines: [...entry.engines].sort(),
      queries: [...entry.queries],
      score: Number(entry.score.toFixed(5)),
    }))

    const rawResultCount = outcomes.reduce(
      (sum, o) => sum + (o.outcome.ok ? o.outcome.results.length : 0),
      0,
    )
    const moreAvailable = ranked.length > returned.length
    const allFailed = failures.length === tasks.length

    // Empty results with an engine restriction are ambiguous: the engine may be
    // throttled out, or the query may genuinely have no matches. One unrestricted
    // probe query settles it — paid only on the failure path.
    let probe: { unrestrictedResults: number; verdict: string } | undefined
    let error: string | undefined
    if (results.length === 0) {
      if (allFailed) {
        error = `All ${tasks.length} request(s) failed — SearXNG may be unreachable at ${endpoint}.`
      } else if (args.engines?.length) {
        const outcome = await fetchPage(endpoint, queries[0], 1, {
          categories: args.categories,
          language: args.language,
          timeRange: args.timeRange,
          safesearch: args.safesearch,
          timeoutMs,
        })
        const count = outcome.ok ? outcome.results.length : 0
        probe = {
          unrestrictedResults: count,
          verdict:
            count > 0
              ? `engines=${args.engines.join(",")} produced nothing while an unrestricted search of the same query returned ${count} results — that engine is likely throttled or blocked on this instance.`
              : "the query itself returned nothing even without the engine restriction.",
        }
        error =
          `No results with engines=${args.engines.join(",")}. ` +
          (count > 0
            ? `Unrestricted, the same query returns ${count} results — drop the engine filter.`
            : "Unrestricted, the same query also returns nothing — broaden the query.")
      } else {
        error =
          `SearXNG returned no results for ${queries.length} quer${queries.length === 1 ? "y" : "ies"}` +
          (args.categories?.length ? ` with categories=${args.categories.join(",")}` : "") +
          ". Broaden the query or drop filters."
      }
    }

    return JSON.stringify({
      ok: results.length > 0,
      ...(error ? { error } : {}),
      ...(probe ? { probe } : {}),
      stats: {
        queries: queries.length,
        pagesRequested: tasks.length,
        pagesFetched: tasks.length - failures.length,
        emptyPages,
        rawResults: rawResultCount,
        uniqueResults: ranked.length,
        returned: results.length,
        duplicatesRemoved: rawResultCount - ranked.length,
        moreAvailable,
        thin: ranked.length < queries.length * 5,
        engineCounts,
        degradedCount: degraded.size,
        degradedEngines: Object.fromEntries(
          [...degraded].slice(0, 20).map(([name, reasons]) => [name, [...reasons]]),
        ),
        suggestions: [...suggestions].slice(0, 6),
        failures,
        elapsedMs: Date.now() - started,
      },
      results,
    })
  },
})
