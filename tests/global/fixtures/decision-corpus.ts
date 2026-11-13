/**
 * Hand-labelled data for the decisions tests.
 *
 * `DECISIONS` / `NON_DECISIONS` are realistic assistant sentences: the negatives
 * include questions, requests, status reports, descriptions of code, and
 * options. The options matter most — "we could use X" is not a decision, and a
 * classifier that treats it as one poisons the compaction prompt with work
 * nobody agreed to.
 *
 * `CALIBRATION` is the per-decision set the registered thresholds were measured
 * against. It is deliberately small and distinct from the extraction corpus:
 * these are the marginal cases where the two hypotheses must land on opposite
 * sides, and `decisions.test.ts` fails if a model swap moves them.
 */

export const DECISIONS: string[] = [
  'We will use Postgres instead of SQLite for the audit log.',
  "I'll go with the second approach: one plugin, not two.",
  'Decision: the memory DB stays at .opencode/state/vector/memory.db.',
  'Going with q8 quantization for every model.',
  'We settled on native dialog.select for the todo menu.',
  "Let's stick with the existing retry policy rather than adding a circuit breaker.",
  'The team agreed to drop the Python scripts and move everything to TypeScript tools.',
  'I chose to keep the gate tighter than the model rather than the reverse.',
  'Final call: no new dependency, use the existing embedder.',
  'We are standardizing on bun for tests.',
  'I will not add a training pipeline; zero-shot it is.',
  'Approved: archive items after 30 days.',
  'The plan is to ship the decisions model behind a flag.',
  "We're keeping the threshold at 0.82 and revisiting after a week of real data.",
  'Decided against a second plugin; rio absorbs both.',
  'From now on the gate consults the model only as a tightening signal.',
  'Use bun, not npm, as the test runner.',
  'Switching the store over to sqlite.',
  "We're going to keep the classifier advisory.",
  "I'll treat the second reading as correct.",
  'No new dependency — reuse bge-small.',
  'The default is q8 everywhere.',
  'Locking in xlarge for this dialog.',
  'We drop the V1 path entirely.',
  'Memories go in the project DB, not the user cache.',
  "I'd rather hold the turn than fire the queue.",
  'The decision is to keep the pure function pure and put the model in `decide`.',
  "Let's commit to the native API and delete the custom JSX.",
  'Renaming the subcommand to `decide` instead of `classify`.',
  'Right, so: rio owns memory, memory-hub reads the same DB.',
]

export const NON_DECISIONS: string[] = [
  'All 47 tests pass and the type check is clean.',
  'I added a helper that returns the RGBA object as-is.',
  'Would you like me to finish those edits and commit?',
  'The footer vanished because the scrollbox wrapped the whole column.',
  'Here is the diff for the todo menu rewrite.',
  'CI run 43336962264 succeeded.',
  'That made the footer vanish and was worse in every way.',
  'The file has 265 lines.',
  'I hit a compile error in the rewritten todo file.',
  'Let me know if you want me to continue.',
  'Reading the three files now.',
  'This module scores a premise against a hypothesis at inference time.',
  'The model is cached under node_modules so a purge cannot remove it.',
  'There are three files in the plugin directory.',
  'I ran the suite and it passed.',
  'The sentence is split on punctuation before scoring.',
  'We could also use Postgres here.',
  'One option would be to cache the scores.',
  'If we switched to Postgres we would save the migration.',
  'You might prefer the second approach.',
  'The parser is in `gate.ts` and the runtime in `runtime.ts`.',
  'Which of these two do you want?',
  'That is a reasonable question and it depends on the workload.',
  'I am not sure the gate is holding correctly.',
  'It would be nice to have a local classifier for this.',
  'The tests are slow because the model loads every time.',
  'Shall I proceed with the rewrite?',
  'This is the third attempt at the footer layout.',
  'Committing and pushing now.',
  'The numbers come from the last CI run.',
]

export const CALIBRATION = {
  failure: {
    pos: [
      'The build failed with exit code 1.',
      'TypeError: cannot read properties of undefined at line 42.',
      'The test suite is red on main.',
      'Connection refused when reaching the database.',
      'The bundler threw during transform of tui.tsx.',
      'I hit a compile error in the rewritten file.',
    ],
    neg: [
      'All 47 tests pass.',
      'The type check is clean.',
      'CI run 43336962264 succeeded.',
      'The server is up and serving requests.',
      'Deployed to production without incident.',
      'The migration applied cleanly.',
    ],
  },
  asksChoice: {
    pos: [
      'Which do you prefer, the native API or the custom JSX?',
      'Should I use Postgres or SQLite here?',
      'Do you want me to keep going?',
      'Let me know which branch to take.',
      'Pick one: rewrite or revert.',
      'Would you rather I split this into two commits?',
    ],
    neg: [
      'The native API is the better choice.',
      'I rewrote it and split the commits.',
      'Postgres is already in use.',
      'The branch is called main.',
      'This commit reverts the rewrite.',
      'Both options are documented above.',
    ],
  },
  ask: {
    pos: [
      'Which do you prefer, the native API or the custom JSX?',
      'Should I use Postgres or SQLite here?',
      'Do you want me to keep going?',
      'Let me know which branch to take.',
      'Would you rather I split this into two commits?',
      'Shall I proceed with the rewrite?',
    ],
    neg: [
      // 'The native API is the better choice.' is deliberately absent — see
      // ASK_KNOWN_FALSE_POSITIVE below. The other five are clean completions.
      'I rewrote it and split the commits.',
      'Postgres is already in use.',
      'All 47 tests pass and the type check is clean.',
      'Here is the diff for the todo menu rewrite.',
      'Committing and pushing now.',
    ],
  },
} as const

/**
 * A statement the `ask` decision misreads, recorded rather than hidden.
 *
 * `ask` reuses the prompt-queue gate's threshold (0.817), which was measured on
 * turn *tails* where an ask is expected. On a bare preference statement the same
 * score lands above it — measured Δ 2.27, p ≈ 0.906 — so `decide(ask, …)` says
 * "this asks the reader something" about a sentence that does not.
 *
 * It is a real false positive of the registry, and `decisions.test.ts` asserts
 * it as one. It does not reach rio's extractor: that path only consults `ask`
 * for sentences containing second-person address, which this sentence has none
 * of. Lowering the threshold would trade this case for the turn tails the gate
 * depends on, so the gap is stated instead.
 */
export const ASK_KNOWN_FALSE_POSITIVE = 'The native API is the better choice.'
