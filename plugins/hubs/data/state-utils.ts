import * as fs from "fs"
import * as path from "path"

/**
 * Get the state directory for a hub
 */
export function getStateDir(hub: string, projectRoot: string): string {
  return path.join(projectRoot, '.opencode', 'state', hub === 'ideation' ? 'ideation' : hub === 'orchestrate' ? 'orchestration' : hub)
}

/**
 * Scan a directory for files (non-recursive), sorted by mtime descending
 */
export function scanDir(dirPath: string): Array<{name: string; mtime: Date; path: string}> {
  if (!fs.existsSync(dirPath)) return []
  return fs.readdirSync(dirPath)
    .map(name => {
      const fullPath = path.join(dirPath, name)
      const stat = fs.statSync(fullPath)
      return { name, mtime: stat.mtime, path: fullPath }
    })
    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())
}

/**
 * Get the latest checkpoint file for a hub
 */
export function getLatestCheckpoint(hub: string, projectRoot: string): {name: string; path: string; mtime: Date} | null {
  const stateDir = getStateDir(hub, projectRoot)
  const checkpointsDir = path.join(stateDir, 'checkpoints')
  const files = scanDir(checkpointsDir)
  return files.length > 0 ? files[0] : null
}

/**
 * Update or create a state index file for a hub
 */
export function updateStateIndex(hub: string, projectRoot: string, metadata: Record<string, unknown>): void {
  const stateDir = getStateDir(hub, projectRoot)
  const indexPath = path.join(stateDir, 'index.json')
  let index: Record<string, unknown> = {}
  if (fs.existsSync(indexPath)) {
    try { index = JSON.parse(fs.readFileSync(indexPath, 'utf-8')) } catch {}
  }
  Object.assign(index, metadata)
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf-8')
}
