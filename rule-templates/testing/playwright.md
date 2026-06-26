---
name: testing-conventions
description: Playwright E2E testing conventions — page objects, selectors, parallel execution, CI config
tags: [testing, playwright, e2e, conventions]
---

# E2E Testing Conventions (Playwright)

## Page Objects
- One Page Object Model class per page/feature
- Methods return promises and represent user actions: `login(email, password)`
- Locators are class properties, defined with `page.getByRole()` / `page.getByTestId()`
- Avoid exposing raw locators to tests — wrap in action methods

## Selectors
- Use `data-testid` attributes over CSS classes or text content
- Test IDs follow `component-purpose` pattern: `login-submit`, `nav-profile`
- Use `getByRole()` for accessibility-first selectors
- Use `getByText()` only for content verification, not interaction

## Test Structure
- One spec file per feature/user flow
- Use `test.beforeEach()` for common setup (login, navigation)
- Use `test.use()` for fixture overrides (viewport, storage state)
- Snapshot names match test case names

## Parallel Execution
- Tests are independent and order-independent
- Use `test.describe.configure({ mode: 'parallel' })` for independent suites
- Use `fullyParallel: true` in playwright.config
- No shared global state between tests

## CI Configuration
- Retry flaky tests 2x in CI
- Use `--reporter=html` for visual diff reports
- Use `--shard=x/y` for multi-machine parallel runs
- Trace viewer on failure: `--trace on-first-retry`
