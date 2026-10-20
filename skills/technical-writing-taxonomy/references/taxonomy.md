# Technical Writing Taxonomy — full reference

A form map of technical writing as it actually appears in computer science and software
development. Grouped by the job the piece does for its reader. Most real articles are one dominant
type plus one or two supporting modes.

For each type: its **shape** (the structural spine readers expect) and its **signature failure**
(the way pieces of this type most often go wrong).

---

## 1. Practice-transfer — reader leaves able to *do* something

### Tutorial
Guided path to a working end state, learning-oriented (Diataxis tutorial quadrant).
Shape: end result → prerequisites → numbered steps (action, code/command, expected result, common
errors) → verification → next steps.
Signature failure: untested on a clean environment — every missing step loses readers.

### How-to / recipe
Solves one specific problem for a reader who is already competent; skips theory.
Shape: problem statement → constraints → solution steps → variations/edge cases.
Signature failure: drifting into teaching theory the reader didn't ask for.

### Cookbook / pattern-catalog entry
Named problem → solution sketch → when it fails. Many entries per piece or per site.
Shape: problem → recipe → discussion → see-also.
Signature failure: recipes without failure conditions become cargo cults.

### Setup / environment guide
Zero to working toolchain. The most-searched genre on the internet.
Shape: platform matrix → prerequisites → install → configure → verify ("hello world" proof).
Signature failure: undated content — these die fast; without a date and versions, trust is zero.

### Migration guide / upgrade walkthrough
Version-to-version moves, breaking-change navigation.
Shape: what changed → who is affected → step-by-step move → rollback plan → verification.
Signature failure: no rollback path.

### Debugging walkthrough / bug hunt
The investigation as mystery narrative. Shorter cousin: the **"the bug was X" micro-post** (one
symptom, one root cause, one lesson — Julia Evans / danluu style).
Shape: symptom → first hypothesis → investigation (dead ends shown) → revelation → fix → lesson.
Signature failure: hiding the dead ends — the wrong hypotheses are what build the reader's skill.

### Performance deep dive / optimization journey
Half benchmark, half bug hunt.
Shape: baseline → profile → hypothesis → fix → measure → repeat → final numbers.
Signature failure: optimization without measurement between steps; claims without repro.

---

## 2. Knowledge-transfer — reader leaves *understanding* something

### Explainer / conceptual deep dive
"How does X actually work?"
Shape: why it matters → simple mental model → progressive depth → common misconceptions →
practical implications.
Signature failure: starting at full accuracy instead of the simplest accurate model.

### Internals / under-the-hood series
"How Postgres stores a row", "what the JVM does with your lambda." Changes how readers reason.
Shape: motivating question → the mechanism layer by layer → observable proof (commands, hex dumps,
logs) → what this explains about behavior you've seen.
Signature failure: mechanism without observable consequence — readers need the "so that's why…".

### "X from scratch" build-along
Write a database / OS / regex engine / compiler in Y. Teaching by reconstruction.
Shape: the smallest working version → one feature at a time, each motivated → tests as
understanding-checks → what we deliberately left out.
Signature failure: skipping to the polished final code — the growth of the artifact is the lesson.

### Paper explainer / distillation
Academic result translated to practitioner language.
Shape: the problem the paper solves → the key idea in one paragraph → how it works → what it costs
→ what came of it.
Signature failure: summarizing the abstract instead of the idea.

### Concept history
"Why CSS is like that", "why Git's UI is like that." Often the highest-traffic explainers.
Shape: the modern annoyance → the historical constraint at each decision point → how the
constraints compounded → what we'd do with a clean slate.
Signature failure: mocking past decisions without their constraints — history pieces live on
fairness to context.

### Essay-shaped reference
"X explained in one page." Between docs and blog; durable.
Shape: tight scope → compressed facts → minimal narrative.
Signature failure: scope creep into a full guide — the compression is the value.

### X vs Y conceptual comparison
Processes vs threads vs actors; SQL vs NoSQL. The reader wants a decision frame, not numbers.
Shape: the shared problem → each approach's model → where each wins → a decision heuristic.
Signature failure: pretending neutrality while smuggling a preference — state your context's
weighting.

---

## 3. Experience-transfer — reader inherits your *judgment*

### Postmortem / incident writeup
The genre with the strongest conventions in the industry (timeline, impact, root cause, what
worked, action items). Public postmortems (Cloudflare, GitHub, Stripe) are a distinct literary form.
Shape: impact summary → timeline → root cause → what went well → action items with owners.
Signature failure: blame-shaped language — postmortems are process documents, not verdicts.

### Lessons learned / retrospective
Includes **"N years of X"** posts ("10 years of running Postgres in production").
Shape: context → 3–5 lessons (best first, each with a specific story) → meta-lesson.
Signature failure: lessons as abstract principles without the story that earned them.

### How We Built It / engineering blog post
The backbone of every company engineering blog (Netflix, Uber, Shopify, Discord).
Shape: goal → constraints → architecture → key decisions as tradeoffs → what we'd change →
takeaways.
Signature failure: decisions presented as "the right answer" instead of tradeoffs under constraint.

### We Rewrote It in X / migration story
Reader question: should I do this too?
Shape: the pain → why the new thing → the process → what went wrong → metrics → would we do it
again.
Signature failure: omitting "what went wrong" — without it, it's a press release.

### Failed-experiment writeup
"We tried X and rolled it back." Rarest and most trusted.
Shape: the hypothesis → the rollout → the evidence it failed → the rollback → what we keep.
Signature failure: softening the failure — the genre's entire value is the honest negative result.

### Trade study / decision record made public
An ADR written for strangers.
Shape: the decision → options considered → criteria → choice → regrets/reversibility.
Signature failure: documenting only the winner; the rejected options are the transferable part.

### War story / anecdote
Single incident told for the principle. Cheaper than a postmortem, often more memorable.
Shape: situation → the moment it went sideways → what we did → the principle.
Signature failure: principle-first — the story must earn the aphorism.

---

## 4. Opinion & industry — reader updates their *position*

### Essay / opinion piece
Shape: observation → evidence → steelman → thesis → implications.
Signature failure: the missing or straw-manned steelman — what separates analysis from hot takes.

### Rant / polemic
Legitimate when honest ("X considered harmful" lineage).
Shape: the grievance → the evidence → the strongest case for the status quo → why it still loses.
Signature failure: all heat — a rant without the steelman is just noise with confidence.

### Tech-strategy analysis
What a company's move means for your stack (Stratechery-shaped, engineer-written).
Shape: the move → the incentives it reveals → second-order effects → what you should do about it.
Signature failure: reporting the news instead of analyzing the incentives.

### Trend report / state-of-X survey
Stack Overflow survey writeups, ThoughtWorks Radar, "State of JS" commentary. Data-driven opinion.
Shape: the data → the shifts that matter → what to adopt/hold/avoid.
Signature failure: listing every finding; the selection is the analysis.

### Prediction / year-in-review
Low-trust genre unless it scores last year's predictions first.
Shape: last year's scorecard → this year's calls → what would prove each wrong.
Signature failure: unfalsifiable predictions.

### Response / rebuttal piece
"A response to [viral post]." High engagement, high burn risk.
Shape: what the original got right → precisely where it diverges → the evidence → the larger point.
Signature failure: responding to the weakest version of the argument.

---

## 5. Tool & product — reader *evaluates or adopts*

### Release notes / changelog
The most-read technical writing most engineers ever write.
Shape: version → changes grouped by impact → "why" per notable change → upgrade notes.
Signature failure: commit-message paste — a changelog is user-facing prose, not a git log.

### Launch post / announcement
Shape: celebration hook → what it is → why it exists → how to try it in the next 10 minutes.
Signature failure: marketing voice — developer launches convert on specificity, not adjectives.

### Tool review / "I tried X so you don't have to"
Hands-on evaluation with a verdict.
Shape: what I tried to do → setup experience → where it shone → where it broke → verdict and for whom.
Signature failure: no stated evaluation criteria — a verdict without criteria is a vibe.

### Benchmark / shootout
Shape: the question → methodology → results → analysis with caveats → recommendations →
reproduction notes.
Signature failure: conclusions before methodology — no trust in setup, no trust in numbers.

### Comparison matrix / buyer's-guide-for-engineers
Feature tables plus a decision frame.
Shape: the use cases → the criteria → the matrix → the decision heuristic per use case.
Signature failure: matrix without the heuristic — tables don't decide, frames do.

---

## 6. Community & career — reader *relates*

### Career narrative
"How I became a staff engineer", job-hunt retrospectives, salary transparency posts.
Shape: the starting point → the turning points with specifics → the numbers where relevant → what
generalizes.
Signature failure: survivorship invisibility — name the luck and the context.

### Mentorship/advice essay
"Advice to my younger self", "what seniority actually means."
Shape: the claim → the experience behind it → when the advice fails.
Signature failure: universalizing one path.

### Community meta-writing
How a community/team/venue works; conference talk recaps; meetup summaries.
Shape: what happened → what was said that matters → links → your take.
Signature failure: recap without curation — the filter is the value.

### Reading list / annotated bibliography
Curated links where the annotation is the value.
Shape: the theme → entries with one-paragraph "why this one" each → reading order.
Signature failure: bare links.

### Newsletter / week-in-review
The link-log form. Chronological, serial, relationship-driven rather than search-driven.
Signature failure: trying to also be reference content — newsletters are read, not consulted.

---

## 7. Formal & semi-formal genres — the "writing that isn't a blog post" tier

### Reference documentation
API docs, man pages. Diataxis reference quadrant: information-oriented, consulted not read.
Shape: consistent entry template → exhaustive within scope → examples per entry.
Signature failure: narrative structure — reference must be randomly accessible.

### Concept documentation / architecture overview
Docs-site explainers.
Shape: the model → the vocabulary → how the parts relate → where to go deeper.
Signature failure: assuming vocabulary the reader hasn't been given.

### Style guide / conventions doc
"How we write Go at X."
Shape: rule → rationale → BAD/GOOD example pairs.
Signature failure: rules without rationale — unenforceable and unmemorable.

### RFC / design doc / tech spec
Internal by default, but public ones (IETF RFCs, Python PEPs, Rust RFCs) are among the most
influential technical writing in existence.
Shape: context → goals/non-goals → design → alternatives considered → open questions.
Signature failure: no "alternatives considered" section — a design without its rejects can't be
evaluated.

### Whitepaper
Marketing-adjacent now, but the systems whitepaper (Dynamo, MapReduce, Bitcoin) built the industry.
Shape: problem → insight → system → evaluation → impact.
Signature failure: evaluation-free claims.

### Academic paper / technical report
The upstream source the blog ecosystem distills.
Shape: abstract → related work → method → evaluation → limitations.
Signature failure (for practitioner audiences): burying the idea under related work.

### Runbook / playbook
Operational writing; almost never public, increasingly blogified as "how we operate X" posts.
Shape: symptom → diagnosis steps → remediation → escalation.
Signature failure: prose where a checklist belongs.

### Book-length
O'Reilly-style trade books, self-published engineer books, the serialized-book blog strategy.
Shape: chapter arc per concept; each chapter must stand as an essay and build.
Signature failure: blog-post sprawl without the cross-chapter arc.

### Talk transcript / conference talk
Increasingly published as essays; the essay-shaped transcript is its own form.
Shape: spoken cadence preserved, slides replaced by inline figures, Q&A folded in.
Signature failure: raw transcript — verbal filler that charms in a room dies on the page.

---

## 8. Interactive & non-prose — the boundary cases

### Interactive explainer
Scrollytelling, embedded simulations (Bartosz Ciechanowski lineage). The essay with a physics
engine inside.
Shape: each concept gets a manipulable model → prose is annotation → build to a capstone demo.
Signature failure: interaction as decoration — the widget must teach, not dazzle.

### Notebook-style writing
Jupyter/Observable posts — prose interleaved with runnable code and live output.
Shape: narrative cells → code cells whose output carries the argument → rerun-from-top hygiene.
Signature failure: outputs that don't reproduce — a notebook is a claim with a recipe.

### Literate-programming post
The article *is* the codebase, lightly.
Shape: the file as the spine; prose walks it top to bottom.
Signature failure: choosing this form for code that isn't linearly readable.

### Visual essay / diagram-first post
The article is the diagram sequence; prose is annotation.
Shape: one diagram per idea, sequence tells the story.
Signature failure: diagrams as illustrations of prose instead of the argument itself.

### Cheatsheet / reference card
Compressed reference, one page, no narrative.
Shape: grouped by task → syntax + minimal example per entry.
Signature failure: completeness over usability — a cheatsheet that needs scrolling has failed.

### Video essay / livestream coding
Not prose, but competes for the same attention; blog posts increasingly ship with a companion video.
Shape: demonstrated in real time; the cuts carry the pacing.
Signature failure: treating the video and the post as interchangeable — they serve different
consumption modes; link them, don't duplicate them.

---

## Cross-cutting modes — attach to any type above

These modify a dominant type rather than replace it.

| Mode | What it does | Constraint |
|------|--------------|------------|
| **Series** | Splits any type into numbered installments | Each part must hook and close its own loop |
| **Interview / Q&A** | Transcript-shaped; common in community/career writing | Edit for density — raw transcripts ramble |
| **Annotated code/diff** | The body is a walk through a real diff or file | The artifact must be real and worth reading |
| **Live narrative** | "Trying X for the first time, writing as I go" | Low polish is the point; do not retrofit certainty |
| **Roundup** | N related items under one theme ("5 things I learned from the Postgres source") | The items must share one load-bearing theme |

---

## Type-selection heuristics

1. **The struggle test** (Julia Evans): the best content comes from what you struggled with, not
   what you mastered. If the piece feels textbook, push toward the specific struggle.
2. **The novelty filter** (Julian Shapiro): the angle should be counter-intuitive, counter-
   narrative, shock-and-awe, elegant articulation, or makes-you-feel-seen. If none, find a new
   angle before choosing a type.
3. **Diataxis discipline**: tutorials teach, how-tos solve, explanations build understanding,
   reference informs. Mixing modes within a piece is the most common structural failure — if a
   draft does two jobs, split it.
4. **The "would I do it again" test** for experience-transfer: if the piece can't answer it
   honestly, it isn't done.
5. **Methodology-first for anything with numbers**: benchmarks, performance pieces, trend reports.
   No trust in setup, no trust in conclusions.
