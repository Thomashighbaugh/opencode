import * as fs from "fs"
import * as path from "path"
import * as crypto from "crypto"

// ─── Types ───────────────────────────────────────────────────────────────

export interface CacheEntry<T = string> {
  value: T
  created: number
  ttl: number
  hits: number
}

export interface CacheConfig {
  /** Directory under .opencode/cache/ */
  namespace: string
  /** Default TTL in ms */
  defaultTTL: number
  /** Max hot entries in memory LRU (0 = memory-only, -1 = no limit) */
  maxHotEntries: number
  /** Whether to persist to disk */
  persist: boolean
  /** Whether this namespace is shared across all projects (true) or per-project (false, default) */
  globalScope?: boolean
}

export interface CacheStats {
  namespace: string
  entries: number
  diskEntries: number
  hits: number
  misses: number
  memoryEntries: number
  estimatedTokensSaved: number
  promotedEntries: number
  avgTTLExtension: number
}

// ─── Default Configs ───────────────────────────────────────────────────

export const CACHE_CONFIGS: Record<string, CacheConfig> = {
  "tool":     { namespace: "tool",     defaultTTL: 900_000, maxHotEntries: 200, persist: true },  // 15 min
  "mcp":      { namespace: "mcp",      defaultTTL: 604_800_000, maxHotEntries: 50, persist: true },  // 7 days
  "llm":      { namespace: "llm",      defaultTTL: 3_600_000, maxHotEntries: 100, persist: true },  // 1 hour
  "agent":    { namespace: "agent",    defaultTTL: 1_800_000, maxHotEntries: 50, persist: true },   // 30 min
  "session":  { namespace: "session",  defaultTTL: 86_400_000, maxHotEntries: 20, persist: false }, // 24h, memory only
  "stable":   { namespace: "stable",   defaultTTL: 86_400_000, maxHotEntries: 100, persist: true, globalScope: true },  // 24h — agent defs, skill content, routing tables
  "context7": { namespace: "context7", defaultTTL: 604_800_000, maxHotEntries: 100, persist: true, globalScope: true },  // 7 days — Context7 doc results
  "file":     { namespace: "file",     defaultTTL: 86_400_000, maxHotEntries: 200, persist: false }, // 24h, memory only — file read cache
}

// ─── Project Slug ─────────────────────────────────────────────────────

const GENERIC_BASENAMES = new Set(["opencode", "src", "lib", "test", "tests", "dist", "build", "node_modules", "config", ".opencode"])

export function getProjectSlug(projectRoot: string): string {
  const basename = path.basename(projectRoot).toLowerCase().replace(/[^a-z0-9]/g, "-")
  if (GENERIC_BASENAMES.has(basename) || basename.length < 2) {
    // Use hash of full path for generic directory names
    return crypto.createHash("sha256").update(projectRoot).digest("hex").substring(0, 12)
  }
  return basename
}

// ─── Cache Manager ─────────────────────────────────────────────────────

export class CacheManager {
  private memory = new Map<string, CacheEntry>()
  private config: CacheConfig
  private cacheDir: string
  private stats = { hits: 0, misses: 0, tokensSaved: 0 }
  private accessCounters = new Map<string, { hits: number, firstAccess: number, lastAccess: number }>()
  private promotedEntries = 0
  private totalTTLExtension = 0
  private readonly ADAPTIVE_TTL_MIN = 60_000
  private readonly ADAPTIVE_TTL_MAX = 604_800_000
  private readonly ADAPTIVE_PROMOTION_THRESHOLD = 5

  constructor(config: CacheConfig, projectRoot?: string) {
    this.config = config
    const root = projectRoot || getProjectRoot()
    this.cacheDir = path.join(root, '.opencode', 'cache', config.namespace)
    if (!this.config.globalScope) {
      const slug = getProjectSlug(root)
      this.cacheDir = path.join(this.cacheDir, slug)
    }
    if (config.persist) {
      fs.mkdirSync(this.cacheDir, { recursive: true })
    }
  }

  /** Hash an input string to a cache key */
  static hash(input: string): string {
    return crypto.createHash("sha256").update(input).digest("hex").substring(0, 32)
  }

  /** Build a composite key from multiple parts */
  static key(...parts: string[]): string {
    return CacheManager.hash(parts.join(":"))
  }

  /** Get a cached value. Returns null if not found or expired. */
  get<T = string>(key: string): T | null {
    // Check memory first
    const mem = this.memory.get(key)
    if (mem) {
      if (Date.now() - mem.created < mem.ttl) {
        mem.hits++
        this.stats.hits++
        // Estimate tokens saved (4 chars ≈ 1 token)
        const valStr = typeof mem.value === 'string' ? mem.value : JSON.stringify(mem.value)
        this.stats.tokensSaved += Math.ceil(valStr.length / 4)
        // Adaptive TTL: track hit and promote if threshold met
        this.recordAccess(key)
        return mem.value as T
      }
      this.memory.delete(key)
    }

    // Check disk
    if (this.config.persist) {
      const disk = this.readFromDisk<T>(key)
      if (disk) {
        disk.hits++
        this.stats.hits++
        const valStr = typeof disk.value === 'string' ? disk.value : JSON.stringify(disk.value)
        this.stats.tokensSaved += Math.ceil(valStr.length / 4)
        this.promoteToMemory(key, disk)
        // Adaptive TTL: track hit and promote if threshold met
        this.recordAccess(key)
        return disk.value as T
      }
    }

    this.stats.misses++
    return null
  }

  /** Set a cached value */
  set<T = string>(key: string, value: T, ttl?: number): void {
    const now = Date.now()
    const entry: CacheEntry<T> = {
      value,
      created: now,
      ttl: ttl ?? this.config.defaultTTL,
      hits: 0,
    }

    // Initialize adaptive access counter for new entries
    this.accessCounters.set(key, { hits: 0, firstAccess: now, lastAccess: now })

    // Memory (LRU eviction if needed)
    if (this.config.maxHotEntries >= 0) {
      if (this.memory.size >= this.config.maxHotEntries && !this.memory.has(key)) {
        // Evict least recently hit
        let oldestKey = key
        let oldestHits = Infinity
        for (const [k, v] of this.memory) {
          if (v.hits < oldestHits) {
            oldestHits = v.hits
            oldestKey = k
          }
        }
        this.memory.delete(oldestKey)
        this.accessCounters.delete(oldestKey)
      }
      this.memory.set(key, entry as CacheEntry)
    }

    // Disk
    if (this.config.persist) {
      this.writeToDisk(key, entry as CacheEntry)
    }
  }

  /** Invalidate a specific key */
  invalidate(key: string): void {
    this.memory.delete(key)
    this.accessCounters.delete(key)
    if (this.config.persist) {
      const p = this.diskPath(key)
      try { fs.unlinkSync(p) } catch {}
    }
  }

  /** Invalidate all entries matching a prefix */
  invalidatePrefix(prefix: string): void {
    for (const key of this.memory.keys()) {
      if (key.startsWith(prefix)) { this.memory.delete(key); this.accessCounters.delete(key) }
    }
    if (this.config.persist && fs.existsSync(this.cacheDir)) {
      for (const f of fs.readdirSync(this.cacheDir)) {
        if (f.startsWith(prefix)) {
          try { fs.unlinkSync(path.join(this.cacheDir, f)) } catch {}
        }
      }
    }
  }

  /** Clear all cached entries */
  clear(): void {
    this.memory.clear()
    this.accessCounters.clear()
    this.stats = { hits: 0, misses: 0, tokensSaved: 0 }
    this.promotedEntries = 0
    this.totalTTLExtension = 0
    if (this.config.persist && fs.existsSync(this.cacheDir)) {
      for (const f of fs.readdirSync(this.cacheDir)) {
        try { fs.unlinkSync(path.join(this.cacheDir, f)) } catch {}
      }
    }
  }

  /** Get cache stats */
  getStats(): CacheStats {
    let diskEntries = 0
    if (this.config.persist && fs.existsSync(this.cacheDir)) {
      try { diskEntries = fs.readdirSync(this.cacheDir).length } catch {}
    }
    return {
      namespace: this.config.namespace,
      entries: this.memory.size,
      diskEntries,
      hits: this.stats.hits,
      misses: this.stats.misses,
      memoryEntries: this.memory.size,
      estimatedTokensSaved: this.stats.tokensSaved,
      promotedEntries: this.promotedEntries,
      avgTTLExtension: this.promotedEntries > 0 ? Math.round(this.totalTTLExtension / this.promotedEntries) : 0,
    }
  }

  /** Get or compute a value (memoize pattern) */
  getOrCompute<T = string>(key: string, compute: () => T, ttl?: number): T {
    const cached = this.get<T>(key)
    if (cached !== null) return cached
    const value = compute()
    this.set(key, value, ttl)
    return value
  }

  /** Get adaptive TTL telemetry stats */
  getAdaptiveStats(): { totalTracked: number; promotedEntries: number; avgTTLExtension: number; activeHotEntries: number } {
    const activeHotEntries = [...this.accessCounters.values()].filter(a => a.hits >= this.ADAPTIVE_PROMOTION_THRESHOLD).length
    return {
      totalTracked: this.accessCounters.size,
      promotedEntries: this.promotedEntries,
      avgTTLExtension: this.promotedEntries > 0 ? Math.round(this.totalTTLExtension / this.promotedEntries) : 0,
      activeHotEntries,
    }
  }

  /**
   * Prune cold entries from memory — entries with 0 adaptive hits
   * whose age exceeds half the default TTL. Frees memory for
   * potentially more useful entries.
   */
  pruneColdEntries(): number {
    const now = Date.now()
    const cutoff = this.config.defaultTTL / 2
    let pruned = 0
    for (const [key, entry] of this.memory) {
      const acc = this.accessCounters.get(key)
      const entryAge = now - entry.created
      // Evict if entry has 0 hits from adaptive tracking and is older than half default TTL
      if ((!acc || acc.hits === 0) && entryAge > cutoff) {
        this.memory.delete(key)
        this.accessCounters.delete(key)
        pruned++
      }
    }
    return pruned
  }

  // ─── Private ───────────────────────────────────────────────────────

  /** Track a cache hit and promote the entry's TTL if hit threshold is met */
  private recordAccess(key: string): void {
    const now = Date.now()
    let counter = this.accessCounters.get(key)
    if (!counter) {
      counter = { hits: 0, firstAccess: now, lastAccess: now }
      this.accessCounters.set(key, counter)
    }
    counter.hits++
    counter.lastAccess = now

    // Promote entry if it's in memory and has crossed the threshold
    if (counter.hits >= this.ADAPTIVE_PROMOTION_THRESHOLD) {
      const entry = this.memory.get(key)
      if (entry) {
        const extension = Math.min(entry.ttl * 2, this.ADAPTIVE_TTL_MAX) - entry.ttl
        if (extension > 0) {
          entry.ttl = Math.min(entry.ttl * 2, this.ADAPTIVE_TTL_MAX)
          this.promotedEntries++
          this.totalTTLExtension += extension
        }
      }
    }
  }

  private diskPath(key: string): string {
    return path.join(this.cacheDir, `${key}.json`)
  }

  private readFromDisk<T>(key: string): CacheEntry<T> | null {
    try {
      const p = this.diskPath(key)
      if (!fs.existsSync(p)) return null
      const raw = fs.readFileSync(p, "utf-8")
      const entry: CacheEntry<T> = JSON.parse(raw)
      if (Date.now() - entry.created < entry.ttl) {
        return entry
      }
      // Expired — clean up
      fs.unlinkSync(p)
      return null
    } catch {
      return null
    }
  }

  private writeToDisk(key: string, entry: CacheEntry): void {
    try {
      fs.writeFileSync(this.diskPath(key), JSON.stringify(entry), "utf-8")
    } catch {
      // Silently fail on disk write errors
    }
  }

  private promoteToMemory<T>(key: string, entry: CacheEntry<T>): void {
    if (this.config.maxHotEntries >= 0) {
      if (this.memory.size >= this.config.maxHotEntries) {
        let oldestKey = key
        let oldestHits = Infinity
        for (const [k, v] of this.memory) {
          if (v.hits < oldestHits) {
            oldestHits = v.hits
            oldestKey = k
          }
        }
        this.memory.delete(oldestKey)
        this.accessCounters.delete(oldestKey)
      }
      this.memory.set(key, entry as CacheEntry)
    }
  }

  /** Migrate per-project cache namespaces from flat to slug-prefixed layout */
  static migrateToPerProject(projectRoot: string): void {
    const root = projectRoot || getProjectRoot()
    for (const [name, config] of Object.entries(CACHE_CONFIGS)) {
      if (config.globalScope) continue
      const oldDir = path.join(root, ".opencode", "cache", name)
      const slug = getProjectSlug(root)
      const newDir = path.join(oldDir, slug)
      if (!fs.existsSync(oldDir)) continue
      if (fs.existsSync(newDir)) continue // Already migrated

      // Only migrate if oldDir is flat (no subdirectories)
      let hasSubdirs = false
      try {
        const entries = fs.readdirSync(oldDir, { withFileTypes: true })
        for (const entry of entries) {
          if (entry.isDirectory()) { hasSubdirs = true; break }
        }
      } catch { continue }

      if (hasSubdirs) continue // Contains subdirs — already migrated or mixed state

      try {
        fs.mkdirSync(path.dirname(newDir), { recursive: true })
        fs.renameSync(oldDir, newDir)
      } catch {
        // Best-effort: if rename fails, invalidate old cache
        try { fs.rmSync(oldDir, { recursive: true, force: true }) } catch {}
      }
    }
  }
}

// ─── Singleton Cache Instances ──────────────────────────────────────────

let _projectRoot: string | undefined

export function setProjectRoot(root: string): void {
  _projectRoot = root
}

function getProjectRoot(): string {
  if (_projectRoot) return _projectRoot
  try {
    const result = require('child_process').execSync('git rev-parse --show-toplevel 2>/dev/null', { encoding: 'utf-8' }).trim()
    if (result) {
      _projectRoot = result
      return result
    }
  } catch {
    // Fallback to CWD if not a git repo
  }
  _projectRoot = process.cwd()
  return _projectRoot
}

// Lazy singleton instances
const _instances = new Map<string, CacheManager>()

export function getCache(namespace: string, projectRoot?: string): CacheManager {
  const config = CACHE_CONFIGS[namespace]
  if (!config) throw new Error(`Unknown cache namespace: ${namespace}. Available: ${Object.keys(CACHE_CONFIGS).join(', ')}`)
  
  const root = projectRoot || getProjectRoot()
  const key = `${namespace}:${root}`
  
  let instance = _instances.get(key)
  if (!instance) {
    instance = new CacheManager(config, root)
    _instances.set(key, instance)
  }
  return instance
}

// ─── Tool Cache Wrapper ────────────────────────────────────────────────

/**
 * Wraps a tool execution with caching. The tool function is only called
 * on cache miss. Cache key is derived from tool name + serialized args.
 */
export function withToolCache<T>(
  toolName: string,
  args: Record<string, unknown>,
  fn: () => T,
  ttl?: number
): T {
  const cache = getCache("tool")
  const key = CacheManager.key(toolName, JSON.stringify(args))
  return cache.getOrCompute(key, fn, ttl)
}

/**
 * Invalidate tool cache entries for a specific tool (e.g., after a write operation)
 */
export function invalidateToolCache(toolName: string): void {
  const cache = getCache("tool")
  cache.invalidatePrefix(toolName)
}

/**
 * Invalidate all tool caches (e.g., after a significant file system change)
 */
export function invalidateAllToolCaches(): void {
  const cache = getCache("tool")
  cache.clear()
}
