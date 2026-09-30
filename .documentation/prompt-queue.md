# Prompt Queue

Queue follow-up prompts as they occur to you, and let them run automatically at the moment the
assistant finishes a turn **without asking you a question**.

A to-do list for a conversation, written in the order the thoughts arrive rather than in advance.

| Property        | Value |
| --------------- | ----- |
| Entry point     | **ctrl+p command palette** → "Prompt Queue" — not a slash command |
| Ordering        | FIFO, with explicitly-deferred items appended at the end |
| Release trigger | A turn completes and did **not** end on a question |
| Rollover        | Work deferred in a held turn rides along with the next drain |
| Code            | `plugins/prompt-queue/` (gate + drain) · `plugins/hubs-tui/src/queue-commands.ts` (UI) |
| Tests           | 50 |

---

## The problem it solves

Follow-ups arrive *while you are reading*, not before you start. Typing them into the composer
means interrupting your own reading; writing them down means losing them; making the assistant
track them means trusting it to notice them.

And a naive "queue it and fire it" is actively harmful. If a queued prompt fires while the
assistant is mid-question, it:

- buries the question the user is being asked,
- tells the model to start something new while it is waiting on a decision, and
- loses its focus on the task actually in front of it.

So the queue **waits**. It holds through every turn that ends on a question, and releases only
when the assistant has finished saying something and stopped needing anything.

---

## Architecture: two processes, one file

```
   ctrl+p palette (TUI process)                 hooks plugin (server process)
   ──────────────────────────────               ──────────────────────────────
   "Prompt Queue"                               on session.idle
     ├─ Add to Prompt Queue                      ├─ read the last assistant turn
     ├─ Run queued prompts now                   ├─ evaluate the gate
     ├─ Hold the queue                           │    ├─ question → HOLD, carry deferred
     ├─ Show / Remove / Clear                    │    └─ no question → DRAIN, send
     └─ writes ───────────┐                      │
                          ▼                      │
              .opencode/state/prompt-queue/      │
                     queue.json  ◀───────────────┘ writes
```

They are separate processes, so the queue is a single JSON file under `.opencode/state/` —
gitignored, because it is session state, not configuration.

**Both sides write atomically** (temp file in the same directory, then `rename`). A plain
`writeFileSync` on the live path lets the drain half-read the file and silently drop queued work,
which is the one failure a to-do list must not have.

---

## The gate

`plugins/prompt-queue/gate.ts` has no I/O of its own and no clock — the model is **injected** as
an `{ askProbability, reconcile }` pair, so the logic is testable against a stub and against the
real classifier. It is `async` because the classifier is a real inference call.

Four signals, strongest first:

| Signal          | Holds when |
| --------------- | ---------- |
| `popup`          | The turn used `question`, `permission.ask`, or `ask_user` |
| `interrogative` | The final prose ends with `?` |
| `ask-phrase`     | The tail contains an explicit request for a decision — "let me know if…", "should I…", "which one…", "confirm" |
| `classifier`     | A zero-shot NLI model (ONNX, `Xenova/mobilebert-uncased-mnli`) reads the turn as a request for the reader to answer |
| `manual`         | A human set Hold or Release from the palette |

### The classifier can only tighten

| Regex verdict | Model | Result |
| ------------- | ----- | ------ |
| holds | any | **holds** — the model never releases a question |
| releases | holds | **holds** — this is the part that earns its cost |
| releases | silent | releases — the regex gate stands alone |

The phrase list is a floor, not a ceiling: it catches `?` and the explicit phrasings, and the model
catches the rest. It never turns a hold into a release, so a wrong turn costs latency rather than a
buried question.

Measured threshold `0.817`, from 10 hand-labelled turns — framing and label order both had to be
fixed first, and two bugs produced confidently wrong scores. The full story, including the
subtle-ask misses that remain below threshold, is in
[ONNX Runtime](onnx-runtime.md#the-classifier). `PROMPT_QUEUE_DISABLE_MODEL=1` runs the regex
gate alone.

An interactive ask is **definitive**: the user has a dialog on screen, and firing underneath it
hides the question being asked. No text analysis can beat an actual question.

The interrogative test reads the **tail** only, and ignores markdown scaffolding first, so a
question mark inside a code span or a URL does not hold the queue.

### Wrong in one direction, on purpose

The gate errs toward **holding**. A false hold costs one turn of latency. A false release costs
the user's attention and the model's focus, and it is not recoverable. This is also why the
classifier threshold stays high: precision is what makes the model safe to let near the gate.

### The anti-deadlock guard

A gate that only ever holds is a feature that silently does nothing: the queue grows, nothing
runs, and it looks broken. So holding is permitted for at most **3 consecutive turns**
(`DEFAULT_MAX_HOLD_TURNS`), and the counter includes holds raised by the **model**, not just by
the regex signals — otherwise adding a classifier would open a new way to wedge the queue. After that the verdict flips to release and reports
`deadlockBreak` — surfaced, not hidden, so you can tell the gate gave up rather than the queue
having been empty.

A configured limit below 1 is clamped to 1, not 0. Clamping to 0 would mean "never hold", so a
typo would silently disable the whole feature.

---

## FIFO, and why the order is stated in the prompt

Items are released in the order they were queued, with `deferred` items appended after. A model
handed a bare list of five tasks will start whichever it can most easily begin — which is not the
order you thought them in. FIFO is the entire reason this is a queue and not a set, so the
rendered prompt says so explicitly:

```
<prompt-queue drain count="2" reason="clear">
The following were queued while you worked, in the order they were queued.
They run now because the previous turn concluded without asking a question.
Work through them in order; if one depends on a decision, stop and ask.

1. update the README
2. add a changelog entry
</prompt-queue>
```

---

## Rollover

When a turn is held, anything the assistant **explicitly deferred** stays outstanding and rides
along with the next drain:

```
Renamed the file. <deferred>
- update the README
- add a changelog entry
</deferred>
```

Only explicit markers are honoured — a `<deferred>` block, or a headed list ("Left
unaddressed:"). Inferring deferred work from ordinary prose would manufacture tasks the model
never proposed, which is worse than forgetting a hint.

Carried items are deduped against what is already queued, and the rendered prompt marks them
`(carried from a held turn)` so their origin stays visible.

---

## The palette

ctrl+p → **Prompt Queue**:

| Action | Effect |
| ------ | ------ |
| Add to Prompt Queue | Queue a follow-up |
| Add current input to queue | Queue what is in the composer |
| Run queued prompts now | One-shot `release` override — ignores the gate once |
| Hold the queue | One-shot `hold` override — blocks the next drain |
| Show queued prompts | The FIFO, numbered, with provenance |
| Remove a queued prompt | Delete one without running it |
| Clear the queue | Discard everything |

**Why a palette entry and not a slash command.** A slash command has to be typed, remembered, and
executed — three chances to not think of it at the exact moment the follow-up occurs to you. The
whole premise is capturing thoughts as they arrive, so capture has to cost one keystroke from a
menu that is already open.

---

## Known limitation: composer capture

The intent is to move text you have **already typed** into the queue. The current TUI plugin API
exposes `appendPrompt`, `submitPrompt` and `clearPrompt` but offers **no way to read the composer
buffer**, and `TuiPromptRef` is only obtainable by rendering a prompt the plugin does not own.

So the text is collected through a dialog instead. That is a real limitation rather than a design
preference, and it is isolated in a single function:

```ts
export function composerText(): string { return '' }
```

When OpenCode exposes a prompt ref, that function is the only thing that changes. "Add current
input to queue" is already wired to it, and a blank capture falls back to the dialog rather than
queueing an empty task.

---

## Failure containment

The drain is destructive: it empties the queue before sending. If the send fails, the items are
**put back at the front, in order** — losing queued work is the worst outcome this plugin can
produce, and a failed request is a normal occurrence, not an exception.

---

## Bugs this suite found

| Bug | Effect |
| --- | ------ |
| `load()` shallow-spread a module-level `EMPTY_STATE` | Every "no queue file" result shared **one** `items` array with the module. Enqueuing to a fresh project appended to the default, so the first directory created came back holding everything every other directory had queued. Looked like test pollution; was a shared mutable singleton on the write path. |
| `PromptQueuePlugin` is async | The first end-to-end test never awaited the factory, so `hooks.event` was undefined. |

---

## Configuration

There is none, by design. The gate's constants (`DEFAULT_MAX_HOLD_TURNS`) are named exports
rather than config keys, because a value that can be set to a meaningless number is a value that
will be.

---

## Interdependencies

| This system uses | From |
| ---------------- | ---- |
| `session.idle`, `session.messages`, `session.promptAsync` | [Event Interception](plugins-hooks.md) |
| `api.command.register`, `DialogSelect`, `DialogPrompt`, `clearPrompt` | [TUI Plugin](plugins-hubs-tui.md) |
| `.opencode/state/` for session state | [Memory System](memory-system.md) |
| Existing plugin's non-blocking discipline | [Command Hooks](plugins-command-hooks.md) |

→ [Back to README](../README.md)
