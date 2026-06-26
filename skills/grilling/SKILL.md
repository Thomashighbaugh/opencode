---
name: grilling
description: Interview the user relentlessly about every aspect of a plan or design until reaching shared understanding. Use when the user wants to stress-test a plan before building, when plans seem vague or incomplete, when dependencies between decisions need resolution, or when the user says "grill me" or "stress-test this." Walks down each branch of the design tree one question at a time, providing recommended answers.
---

# Grilling

Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one. For each question, provide your recommended answer.

## Rules

- **Ask questions one at a time.** Asking multiple questions at once is bewildering. Wait for feedback before continuing.
- **Provide your recommended answer** for each question. Don't just ask — propose what you think is best.
- **If a question can be answered by exploring the codebase, explore the codebase instead.** Don't ask the user if the answer exists in files.
- **Resolve dependencies between decisions.** If decision B depends on decision A, resolve A first.
- **Push back on vague answers.** If the user says "I don't know", help them think through it rather than accepting ambiguity.
- **Adapt questions to the context.** Don't use a checklist — the questions should flow naturally from the previous answer.

## When to Stop

- All branches of the design tree have been explored
- Dependencies between decisions are resolved
- The plan has enough specificity to be executed
- The user says "that's enough" or "let's proceed"
