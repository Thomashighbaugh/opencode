---
name: brownfield
description: Feature addition to existing codebase — analyze system, identify integration points, validate strategy before implementation
---

# Brownfield

Feature addition to an existing (brownfield) codebase. Analyze the existing system, identify integration points, validate the strategy, then implement with minimal disruption to working functionality. Preserve existing behavior — the first rule of brownfield development is "do no harm."

## When to Use

- Adding a new feature to an existing, mature codebase
- Integrating with legacy systems or third-party services
- Extending functionality in a codebase you haven't worked on before
- Making changes where regression risk is high
- Working in a codebase with existing tests, conventions, and architecture

**Do not use when:**
- Building a greenfield project from scratch — use `plan-execute` or `tdd` instead
- The task is a bug fix in a well-understood area — delegate directly to `@executor`
- You need rapid prototyping with throwaway code — use `vibe-code` instead
- The codebase is brand new with minimal existing code — this is greenfield, not brownfield

## Workflow

### Phase 1: Analyze the Existing System

Before writing any new code, understand the existing system:

1. **Map the architecture**:
   - Read project structure (top-level directories, key files)
   - Identify the framework, language, and major dependencies
   - Understand the module/component hierarchy
   - Read existing tests to understand expected behavior

2. **Identify integration points**:
   - Where will the new feature connect to existing code?
   - What existing APIs, functions, or components need to be called?
   - What data structures and types are already defined?
   - What existing patterns should the new code follow?

3. **Understand conventions**:
   - Naming conventions (files, functions, variables, types)
   - Code organization (how are features structured?)
   - Error handling patterns
   - Testing patterns and coverage expectations
   - Import/export conventions

**Output:** A `BROWNFIELD_ANALYSIS.md` file in `.opencode/state/orchestration/brownfield/` with architecture map, integration points, and conventions.

### Phase 2: Plan the Change

1. Design the new feature to fit within existing architecture
2. Identify files that need to be:
   - **Created** — new modules, components, tests
   - **Modified** — existing files that need integration points
   - **Untouched** — files that must not change
3. Define the minimal interface between new and existing code
4. Identify risk areas — what existing functionality could break?

**Key principle:** Prefer adding new code over modifying existing code. Extend interfaces rather than changing them.

### Phase 3: Validate Strategy

Before implementing, validate the plan:

1. **Run existing tests** — establish a baseline: all tests pass before any changes
2. **Check for assumptions** — verify that the integration points you identified actually exist and work as expected
3. **Prototype the interface** — write a minimal integration test or type definition to validate the approach
4. **Present the plan** (optional, for complex changes): show the user the analysis and plan before proceeding

**Gate rule:** If existing tests don't pass before changes, stop and report. Brownfield work requires a known starting state.

### Phase 4: Implement Incrementally

1. **Add new code first** — create new files, types, and functions that the feature needs
2. **Wire integration points** — connect new code to existing code with minimal changes to existing files
3. **Add tests** — write tests for the new feature
4. **Run tests after each change** — ensure existing tests still pass
5. **Do not refactor existing code** — unless it's directly in the path of the new feature and the refactor is necessary

**Implementation rules:**
- One integration point at a time — wire, test, verify, then wire the next
- Prefer additive changes (new functions, new parameters with defaults) over breaking changes
- If you must modify an existing function signature, update all callers in the same change
- Do not "clean up" adjacent code — touch only what the feature requires

### Phase 5: Verify

1. Run the full test suite — all existing tests pass
2. Run build/typecheck — no errors
3. Run the new feature's tests specifically
4. Verify edge cases — what happens with unexpected inputs?
5. Check for regressions — does anything that used to work now break?

### Phase 6: Document

1. Note any new patterns or conventions established for future reference
2. Document integration points and design decisions
3. Update `.opencode/context/patterns/` if new patterns were discovered

## Constraints

- **Do no harm**: The first priority is preserving existing functionality. New features come second.
- **Prefer additive changes**: Add new code rather than modifying existing code. Extend interfaces, don't break them.
- **No unrelated refactoring**: Do not clean up, reformat, or restructure code that isn't directly related to the feature.
- **Test baseline**: Existing tests must pass before and after changes. If they don't pass before, stop and report.
- **Incremental integration**: Wire one integration point at a time, verifying after each.
- **Minimal surface area**: The interface between new and existing code should be as small as possible.

## Reminder

Analyze and integrate into existing codebase.
