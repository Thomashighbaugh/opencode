/**
 * Read/write the TUI prompt input by locating the live edit buffer in the
 * renderer tree. V2 publishes no composer handle; the host's own stash writes
 * to the same `TextareaRenderable` (`plainText`/`setText`/`gotoBufferEnd`).
 *
 * This is an undocumented lookup, so every call degrades gracefully: an
 * unreachable composer returns false/'' instead of throwing.
 */

export interface Composer {
  readonly plainText: string
  setText(text: string): void
  insertText(text: string): void
  clear(): void
  readonly focused: boolean
  focus?(): void
  gotoBufferEnd?(options?: { focus?: boolean }): void
  readonly isDestroyed?: boolean
}

type Ctx = { renderer?: { root?: unknown } }

let cached: Composer | undefined

function alive(node: Composer | undefined): node is Composer {
  if (!node) return false
  try {
    return node.isDestroyed !== true && typeof node.plainText === "string"
  } catch {
    return false
  }
}

function isComposer(node: unknown): node is Composer {
  if (!node || typeof node !== "object") return false
  const c = node as Partial<Composer>
  return (
    c.isDestroyed !== true &&
    typeof c.plainText === "string" &&
    typeof c.setText === "function" &&
    typeof c.insertText === "function" &&
    typeof c.focused === "boolean"
  )
}

function walk(node: unknown, seen = new Set<unknown>()): Composer[] {
  if (!node || typeof node !== "object" || seen.has(node)) return []
  seen.add(node)
  const found: Composer[] = []
  if (isComposer(node)) found.push(node)
  const children = (node as { getChildren?: () => unknown[] }).getChildren
  if (typeof children === "function") {
    for (const child of children.call(node) ?? []) found.push(...walk(child, seen))
  }
  return found
}

export function findComposer(ctx: Ctx): Composer | undefined {
  if (alive(cached)) return cached
  try {
    const root = ctx.renderer?.root
    if (!root) return undefined
    const editors = walk(root)
    cached = editors.find((e) => e.focused) ?? editors[0]
    return cached
  } catch {
    return undefined
  }
}

export function readComposer(ctx: Ctx): string {
  try {
    return findComposer(ctx)?.plainText ?? ""
  } catch {
    return ""
  }
}

export function appendComposer(ctx: Ctx, text: string): boolean {
  try {
    const editor = findComposer(ctx)
    if (!editor) return false
    editor.insertText(text)
    editor.gotoBufferEnd?.()
    editor.focus?.()
    return true
  } catch {
    return false
  }
}

export function clearComposer(ctx: Ctx): boolean {
  try {
    const editor = findComposer(ctx)
    if (!editor) return false
    editor.clear()
    editor.focus?.()
    return true
  } catch {
    return false
  }
}
