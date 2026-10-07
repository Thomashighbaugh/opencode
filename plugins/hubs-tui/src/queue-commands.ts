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

type QueueItem = { id: string; text: string; enqueuedAt: string; source: 'manual' | 'deferred'; editedAt?: string; copiedFrom?: string }
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
 * Ask the hooks plugin to drain right now.
 *
 * Writes a request file rather than sending anything itself: this plugin and the
 * hooks plugin are separate processes, and only the hooks side knows the session
 * and can call `promptAsync`. The hooks plugin handles the request on its next
 * `file.edited` event, which is why this works while the session is idle — the
 * condition under which arming the `manual: 'release'` flag did nothing at all,
 * because `session.idle` only fires on a transition.
 *
 * Falls back to arming the flag if the write fails, so the request is never
 * simply dropped.
 */
function requestImmediateDrain(directory: string, reason: string, ids?: string[]): boolean {
  try {
    const dir = path.join(directory, '.opencode', 'state', 'prompt-queue')
    fs.mkdirSync(dir, { recursive: true })
    const token = `${Date.now().toString(36)}-tui`
    fs.writeFileSync(
      path.join(dir, `fire-now.${token}.json`),
      JSON.stringify({ reason, ids: ids ?? [], requestedAt: new Date().toISOString() }, null, 2),
    )
    return true
  } catch {
    const s = readQueue(directory)
    s.manual = 'release'
    writeQueue(directory, s)
    return false
  }
}

/** Render a drained batch the same way the hooks side does, for composer hand-off. */
function renderForComposer(items: QueueItem[], reason: string): string {
  if (!items.length) return ''
  const body = items
    .map((it, i) => `${i + 1}. ${it.text}${it.source === 'deferred' ? '   (carried from a held turn)' : ''}`)
    .join('\n')
  return [
    `<prompt-queue drain count="${items.length}" reason="${reason}">`,
    'The following were queued while you worked, in the order they were queued.',
    'Work through them in order; if one depends on a decision, stop and ask.',
    '',
    body,
    '</prompt-queue>',
  ].join('\n')
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
      { title: 'Run queued prompts now', value: 'run', description: 'Fire immediately, no waiting for the next turn' },
      { title: 'Run one queued prompt now', value: 'run-one', description: 'Fire a single item and leave the rest queued', disabled: all.length < 1 },
      { title: 'Add to Prompt Queue', value: 'add', description: 'Queue a follow-up for the next non-question turn' },
      { title: 'Add current input to queue', value: 'add-input', description: 'Queue whatever is in the composer' },
      { title: 'Show queued prompts', value: 'show', description: head, disabled: !all.length },
      { title: 'Edit a queued prompt', value: 'edit', description: 'Rewrite the text, keeping its position', disabled: !all.length },
      { title: 'Copy a queued prompt', value: 'copy', description: 'Duplicate it, or send it to the composer', disabled: !all.length },
      { title: 'Reorder a queued prompt', value: 'reorder', description: 'Move one earlier or later in the queue', disabled: all.length < 2 },
      { title: 'Hold the queue', value: 'hold', description: 'Block the next drain until you release it' },
      { title: 'Remove a queued prompt', value: 'remove', description: 'Delete one without running it', disabled: !all.length },
      { title: 'Clear the queue', value: 'clear', description: 'Discard everything queued', disabled: !all.length },
    ]

    const itemOptions = (title: string, valueFor: (i: QueueItem) => string) =>
      all.map((i, n) => ({
        title: `${n + 1}. ${i.text.length > 60 ? i.text.slice(0, 57) + '…' : i.text}`,
        value: valueFor(i),
        description: [
          i.source === 'deferred' ? 'carried from a held turn' : 'queued manually',
          i.editedAt ? 'edited' : '',
          i.copiedFrom ? 'copy' : '',
        ].filter(Boolean).join(' · '),
      }))

    api.ui.dialog.setSize('large')
    api.ui.dialog.replace(() =>
      DS<string>({
        title: `Prompt Queue — ${head}`,
        placeholder: 'Choose an action…',
        options: opts,
        onSelect: (sel) => {
          api.ui.dialog.clear()
          const value = String(sel?.value ?? '')

          // ── fire now ───────────────────────────────────────────────────
          // Deliberately not "arm a flag for the next turn". `session.idle` only
          // fires on a transition into idle, so arming while already idle waited
          // for a message that might never come — which is exactly the "it never
          // fires" report. The request file is handled on its own event.
          if (value === 'run') {
            if (!all.length) {
              toast('Prompt Queue', 'Nothing queued', 'warning')
              return
            }
            const immediate = requestImmediateDrain(directory, 'tui:run-all')
            toast(
              'Prompt Queue',
              immediate
                ? `Firing ${all.length} prompt(s) now`
                : 'Could not write the fire request — armed the release flag instead',
              immediate ? 'success' : 'warning',
            )
            return
          }

          if (value === 'run-one') {
            api.ui.dialog.replace(() =>
              DS<string>({
                title: 'Run which prompt now?',
                placeholder: 'Choose…',
                options: itemOptions('Run', (i) => i.id),
                onSelect: (pick) => {
                  api.ui.dialog.clear()
                  const id = String(pick?.value ?? '')
                  const item = all.find((i) => i.id === id)
                  if (!item) return
                  const immediate = requestImmediateDrain(directory, 'tui:run-one', [id])
                  toast(
                    'Prompt Queue',
                    immediate ? 'Firing that one now' : 'Falling back to the release flag',
                    immediate ? 'success' : 'warning',
                  )
                },
              }),
            )
            return
          }

          // ── edit ───────────────────────────────────────────────────────
          if (value === 'edit') {
            api.ui.dialog.replace(() =>
              DS<string>({
                title: 'Edit which prompt?',
                placeholder: 'Choose…',
                options: itemOptions('Edit', (i) => i.id),
                onSelect: (pick) => {
                  const id = String(pick?.value ?? '')
                  const item = all.find((i) => i.id === id)
                  api.ui.dialog.clear()
                  if (!item) return
                  api.ui.dialog.replace(() =>
                    DP({
                      // Prefilled, so editing is a correction rather than a retype.
                      // `update` keeps the id and position: re-adding an edited
                      // item at the end would silently reorder the user's plan.
                      title: 'Edit queued prompt — position is kept',
                      placeholder: 'the corrected instruction',
                      value: item.text,
                      onConfirm: (text: string) => {
                        api.ui.dialog.clear()
                        const trimmed = String(text ?? '').trim()
                        if (!trimmed) {
                          toast('Prompt Queue', 'Nothing to save — the text was empty', 'warning')
                          return
                        }
                        const s = readQueue(directory)
                        for (const bucket of [s.items, s.deferred]) {
                          const hit = bucket.find((x) => x.id === id)
                          if (hit) {
                            hit.text = trimmed
                            hit.editedAt = new Date().toISOString()
                            break
                          }
                        }
                        writeQueue(directory, s)
                        toast('Prompt Queue', 'Updated in place', 'success')
                      },
                      onCancel: () => api.ui.dialog.clear(),
                    }),
                  )
                },
              }),
            )
            return
          }

          // ── copy ───────────────────────────────────────────────────────
          if (value === 'copy') {
            api.ui.dialog.replace(() =>
              DS<string>({
                title: 'Copy which prompt?',
                placeholder: 'Choose…',
                options: itemOptions('Copy', (i) => i.id),
                onSelect: (pick) => {
                  const id = String(pick?.value ?? '')
                  const item = all.find((i) => i.id === id)
                  api.ui.dialog.clear()
                  if (!item) return
                  api.ui.dialog.replace(() =>
                    DS<string>({
                      title: `Copy — ${item.text.slice(0, 50)}`,
                      options: [
                        { title: 'Duplicate in the queue', value: 'dup', description: 'Adds a copy directly after the original' },
                        { title: 'Send to the composer', value: 'composer', description: 'Copy the text so you can edit and send it yourself' },
                      ],
                      onSelect: (how) => {
                        api.ui.dialog.clear()
                        const mode = String(how?.value ?? '')
                        if (mode === 'dup') {
                          const s = readQueue(directory)
                          const bucket = s.items.find((x) => x.id === id) ? s.items : s.deferred
                          const at = bucket.findIndex((x) => x.id === id)
                          if (at !== -1) {
                            // Directly after the original: "run this again, right
                            // here". A copy appended to the end is a different
                            // instruction, and a fresh id keeps the two separable
                            // when one is removed.
                            bucket.splice(at + 1, 0, {
                              id: `${Date.now().toString(36)}-tui`,
                              text: item.text,
                              enqueuedAt: new Date().toISOString(),
                              source: item.source,
                              copiedFrom: item.id,
                            })
                            writeQueue(directory, s)
                          }
                          toast('Prompt Queue', 'Duplicated', 'success')
                          return
                        }
                        // Composer hand-off. `appendPrompt` puts the text where the
                        // user can read it before committing to it, which is the
                        // point of "copy" as distinct from "duplicate".
                        void api.client.tui
                          .appendPrompt({ text: item.text })
                          .then(() => toast('Prompt Queue', 'Copied to the composer', 'success'))
                          .catch((e: any) => toast('Prompt Queue', `Could not reach the composer: ${e?.message ?? e}`, 'error'))
                      },
                    }),
                  )
                },
              }),
            )
            return
          }

          // ── reorder ────────────────────────────────────────────────────
          if (value === 'reorder') {
            const list = [...state.items, ...state.deferred]
            api.ui.dialog.replace(() =>
              DS<string>({
                title: 'Move which prompt?',
                placeholder: 'Choose…',
                options: list.map((i, n) => ({
                  title: `${n + 1}. ${i.text.length > 60 ? i.text.slice(0, 57) + '…' : i.text}`,
                  value: i.id,
                })),
                onSelect: (pick) => {
                  const id = String(pick?.value ?? '')
                  const item = list.find((i) => i.id === id)
                  api.ui.dialog.clear()
                  if (!item) return
                  api.ui.dialog.replace(() =>
                    DS<string>({
                      title: 'Move it…',
                      options: [
                        { title: 'Earlier', value: 'up', description: 'Toward the front of the queue' },
                        { title: 'Later', value: 'down', description: 'Toward the back of the queue' },
                      ],
                      onSelect: (dirSel) => {
                        api.ui.dialog.clear()
                        const delta = String(dirSel?.value ?? 'up') === 'down' ? 1 : -1
                        const s = readQueue(directory)
                        const bucket = s.items.find((x) => x.id === id) ? s.items : s.deferred
                        const at = bucket.findIndex((x) => x.id === id)
                        if (at === -1) return
                        const to = at + delta
                        // Off either end is a no-op, not an error — the user asked
                        // for a direction, not for a failure message.
                        if (to < 0 || to >= bucket.length) {
                          toast('Prompt Queue', delta < 0 ? 'Already first' : 'Already last', 'info')
                          return
                        }
                        const [moved] = bucket.splice(at, 1)
                        bucket.splice(to, 0, moved)
                        writeQueue(directory, s)
                        toast('Prompt Queue', `Moved to position ${to + 1}`, 'success')
                      },
                    }),
                  )
                },
              }),
            )
            return
          }

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
