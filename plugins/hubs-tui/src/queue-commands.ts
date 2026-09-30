import type { TuiPluginApi, TuiDialogSelectOption } from '@opencode-ai/plugin/tui'
import * as fs from 'node:fs'
import * as path from 'node:path'

/**
 * queue-commands.tsx — the ctrl+p palette entries for the prompt queue.
 *
 * Registered through `api.command.register`, so these appear **inside the ctrl+p
 * command palette**. That is deliberate and load-bearing: this is not a slash
 * command, because a slash command has to be typed, remembered, and executed —
 * three chances to not think of it at the moment a follow-up occurs to you. The
 * point of the feature is capturing thoughts as they arrive, so the capture has
 * to cost one keystroke from a menu that is already there.
 *
 * ── Process boundary ────────────────────────────────────────────────────────
 *
 * This is a TUI plugin; the queue's gate and drain live in
 * `plugins/prompt-queue/` (a hooks plugin). They are separate processes, so they
 * share one atomically-written JSON file under `.opencode/state/prompt-queue/`.
 * State is gitignored because it is session data.
 *
 * ── Composer capture ────────────────────────────────────────────────────────
 *
 * The intent is to move text the user has already typed into the queue. The
 * current TUI plugin API exposes `appendPrompt`, `submitPrompt` and `clearPrompt`
 * but no way to READ the composer buffer, and `TuiPromptRef` is only obtainable by
 * rendering the prompt a plugin does not own. So this collects the text through a
 * dialog.
 *
 * That is a real limitation, not a design preference, and it is isolated in
 * `composerText()`: when OpenCode exposes a prompt ref, that function becomes the
 * only thing that changes.
 */

type QueueItem = { id: string; text: string; enqueuedAt: string; source: 'manual' | 'deferred' }
type QueueState = {
  items: QueueItem[]
  deferred: QueueItem[]
  consecutiveHolds: number
  manual: 'hold' | 'release' | null
}

function queueFile(directory: string): string {
  return path.join(directory, '.opencode', 'state', 'prompt-queue', 'queue.json')
}

function readQueue(directory: string): QueueState {
  const empty: QueueState = { items: [], deferred: [], consecutiveHolds: 0, manual: null }
  try {
    const raw = JSON.parse(fs.readFileSync(queueFile(directory), 'utf-8'))
    return {
      items: Array.isArray(raw.items) ? raw.items : [],
      deferred: Array.isArray(raw.deferred) ? raw.deferred : [],
      consecutiveHolds: Number.isInteger(raw.consecutiveHolds) ? raw.consecutiveHolds : 0,
      manual: raw.manual === 'hold' || raw.manual === 'release' ? raw.manual : null,
    }
  } catch {
    // No queue yet, or it is mid-write by the other process. Both mean "nothing
    // to show" rather than "fail to open the menu".
    return empty
  }
}

function writeQueue(directory: string, state: QueueState): void {
  const file = queueFile(directory)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  // Temp-then-rename, matching the hooks side. The drain reads this file, and a
  // truncated read would drop queued work.
  const tmp = `${file}.${process.pid}.tui.tmp`
  fs.writeFileSync(tmp, JSON.stringify({ ...state, updatedAt: new Date().toISOString() }, null, 2))
  fs.renameSync(tmp, file)
}

/**
 * Text the user has typed but not sent.
 *
 * Currently always empty — the API exposes no reader. Isolated so that adding
 * one is a single-function change rather than a rework of the menu.
 */
export function composerText(): string {
  return ''
}

export function registerQueueCommands(api: TuiPluginApi, directory: string): () => void {
  const DS = api.ui.DialogSelect
  const DP = api.ui.DialogPrompt

  const toast = (title: string, message: string, variant: any = 'info') =>
    api.ui.toast({ title, message, variant, duration: 3000 })

  const openQueue = () => {
    const state = readQueue(directory)
    const all = [...state.items, ...state.deferred]
    const held = state.consecutiveHolds > 0
    const head = all.length
      ? `${all.length} queued · ${state.consecutiveHolds} turn(s) held for a question`
      : 'Queue is empty'

    const opts: TuiDialogSelectOption<string>[] = [
      { title: 'Add to Prompt Queue', value: 'add', description: 'Queue a follow-up for the next non-question turn' },
      { title: 'Add current input to queue', value: 'add-input', description: 'Queue whatever is in the composer' },
      { title: 'Run queued prompts now', value: 'run', description: 'Release the queue on the next turn regardless of the gate' },
      { title: 'Hold the queue', value: 'hold', description: 'Block the next drain until you release it' },
      { title: 'Show queued prompts', value: 'show', description: head, disabled: !all.length },
      { title: 'Remove a queued prompt', value: 'remove', description: 'Delete one without running it', disabled: !all.length },
      { title: 'Clear the queue', value: 'clear', description: 'Discard everything queued', disabled: !all.length },
    ]

    api.ui.dialog.setSize('large')
    api.ui.dialog.replace(() =>
      DS<string>({
        title: `Prompt Queue — ${head}`,
        placeholder: 'Choose an action…',
        options: opts,
        onSelect: (sel) => {
          api.ui.dialog.clear()
          const value = String(sel?.value ?? '')

          if (value === 'add' || value === 'add-input') {
            api.ui.dialog.replace(() =>
              DP({
                // No JSX `description` here: this plugin's build has no dev JSX
                // runtime export, and the surrounding tui.tsx avoids JSX for the
                // same reason. The guidance fits in the title.
                title:
                  value === 'add-input' && !composerText()
                    ? 'Add to Prompt Queue — paste the follow-up'
                    : 'Add to Prompt Queue — runs after a turn with no question',
                placeholder: 'e.g. also update the README for that change',
                value: value === 'add-input' ? composerText() : '',
                onConfirm: (text: string) => {
                  api.ui.dialog.clear()
                  const trimmed = String(text ?? '').trim()
                  // A blank composer must not become a blank task. Without this
                  // the queue grows and drains a prompt that says nothing.
                  if (!trimmed) {
                    toast('Prompt Queue', 'Nothing to queue — the input was empty', 'warning')
                    return
                  }
                  const s = readQueue(directory)
                  s.items.push({
                    id: `${Date.now().toString(36)}-tui`,
                    text: trimmed,
                    enqueuedAt: new Date().toISOString(),
                    source: 'manual',
                  })
                  writeQueue(directory, s)
                  toast('Prompt Queue', `Queued (${s.items.length + s.deferred.length} waiting)`, 'success')
                  // Clear the composer so the same text is not sent by accident.
                  void api.client.tui.clearPrompt().catch(() => {})
                },
                onCancel: () => api.ui.dialog.clear(),
              }),
            )
            return
          }

          if (value === 'run') {
            const s = readQueue(directory)
            s.manual = 'release'
            writeQueue(directory, s)
            toast('Prompt Queue', 'Releasing on the next turn', 'info')
            return
          }

          if (value === 'hold') {
            const s = readQueue(directory)
            s.manual = 'hold'
            writeQueue(directory, s)
            toast('Prompt Queue', 'Holding until you release it', 'warning')
            return
          }

          if (value === 'show') {
            api.ui.dialog.replace(() =>
              DS<string>({
                title: 'Queued prompts (FIFO)',
                options: all.map((i) => ({
                  title: `${all.indexOf(i) + 1}. ${i.text}`,
                  value: i.id,
                  description: i.source === 'deferred' ? 'carried from a held turn' : 'queued manually',
                })),
                onSelect: () => api.ui.dialog.clear(),
              }),
            )
            return
          }

          if (value === 'remove') {
            api.ui.dialog.replace(() =>
              DS<string>({
                title: 'Remove which prompt?',
                placeholder: 'Choose…',
                options: all.map((i) => ({ title: i.text, value: i.id })),
                onSelect: (sel) => {
                  const id = String(sel?.value ?? '')
                  const s = readQueue(directory)
                  s.items = s.items.filter((i) => i.id !== id)
                  s.deferred = s.deferred.filter((i) => i.id !== id)
                  writeQueue(directory, s)
                  api.ui.dialog.clear()
                  toast('Prompt Queue', 'Removed', 'info')
                },
              }),
            )
            return
          }

          if (value === 'clear') {
            const s = readQueue(directory)
            s.items = []
            s.deferred = []
            s.manual = null
            writeQueue(directory, s)
            toast('Prompt Queue', 'Queue cleared', 'info')
          }
        },
      }),
    )
  }

  return api.command!.register(() => [
    {
      title: 'Prompt Queue',
      value: 'prompt-queue',
      description: 'Queue follow-up prompts to run after a turn that did not end on a question',
      category: 'Hubs Hubs',
      onSelect: openQueue,
    },
  ])
}
