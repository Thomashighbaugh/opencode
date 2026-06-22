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
}

export interface CacheStats {
  namespace: string
  entries: number
  diskEntries: number
  hits: number
  misses: number
  memoryEntries: number
}

// ─── Default Configs ───────────────────────────────────────────────────

export const CACHE_CONFIGS: Record<string, CacheConfig> = {
  "tool":     { namespace: "tool",     defaultTTL: 900_000, maxHotEntries: 200, persist: true },  // 15 min
  "mcp":      { namespace: "mcp",      defaultTTL: 604_800_000, maxHotEntries: 50, persist: true },  // 7 days
  "llm":      { namespace: "llm",      defaultTTL: 3_600_000, maxHotEntries: 100, persist: true },  // 1 hour
  "agent":    { namespace: "agent",    defaultTTL: 1_800_000, maxHotEntries: 50, persist: true },   // 30 min
  "session":  { namespace: "session",  defaultTTL: 86_400_000, maxHotEntries: 20, persist: false }, // 24h, memory only
}

// ─── Cache Manager ─────────────────────────────────────────────────────

export class CacheManager {
  private memory = new Map<string, CacheEntry>()
  private config: CacheConfig
  private cacheDir: string
  private stats = { hits: 0, misses: 0 }

  constructor(config: CacheConfig, projectRoot?: string) {
    this.config = config
    const root = projectRoot || getProjectRoot()
    this.cacheDir = path.join(root, '.opencode', 'cache', config.namespace)
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
        this.promoteToMemory(key, disk)
        return disk.value as T
      }
    }

    this.stats.misses++
    return null
  }

  /** Set a cached value */
  set<T = string>(key: string, value: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      value,
      created: Date.now(),
      ttl: ttl ?? this.config.defaultTTL,
      hits: 0,
    }

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
    if (this.config.persist) {
      const p = this.diskPath(key)
      try { fs.unlinkSync(p) } catch {}
    }
  }

  /** Invalidate all entries matching a prefix */
  invalidatePrefix(prefix: string): void {
    for (const key of this.memory.keys()) {
      if (key.startsWith(prefix)) this.memory.delete(key)
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
    this.stats = { hits: 0, misses: 0 }
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

  // ─── Private ───────────────────────────────────────────────────────

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
      }
      this.memory.set(key, entry as CacheEntry)
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
