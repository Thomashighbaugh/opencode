# Testing Rules

## Minimum Test Coverage: 80%

Test Types (use as appropriate):
1. **Unit Tests** - Individual functions, utilities, components
2. **Integration Tests** - API endpoints, database operations
3. **E2E Tests** - Critical user flows

## Test-Driven Development

Recommended workflow for complex changes:
1. Write test first (RED)
2. Run test - it should FAIL
3. Write minimal implementation (GREEN)
4. Run test - it should PASS
5. Refactor (IMPROVE)
6. Verify coverage (80%+)

Use judgment — skip TDD for trivial fixes where test overhead exceeds benefit.

## Edge Cases to Test

Every function must be tested with:
- [ ] Null/undefined inputs
- [ ] Empty arrays/strings
- [ ] Invalid types
- [ ] Boundary values (min/max)
- [ ] Error conditions

## Test Quality Checklist

- [ ] Tests are independent (no shared state)
- [ ] Test names describe behavior
- [ ] Mocks used for external dependencies
- [ ] Both happy path and error paths tested
- [ ] No flaky tests

## Examples

### BAD: Test that tests implementation details
```typescript
// BAD: Testing internal state, not behavior
it('calls internal helper', () => {
  const spy = jest.spyOn(internals, 'formatDate');
  const result = formatUserDate(user);
  expect(spy).toHaveBeenCalled(); // Tests implementation detail
});
```

### GOOD: Test that tests behavior
```typescript
// GOOD: Testing observable behavior
it('formats user date as "Jan 1, 2024"', () => {
  const user = { createdAt: new Date('2024-01-01') };
  const result = formatUserDate(user);
  expect(result).toBe('Jan 1, 2024');
});
```

### BAD: Mega-test (multiple behaviors in one test)
```typescript
// BAD: Testing 3 things in one test
it('handles users correctly', () => {
  expect(createUser({ name: 'Alice' })).toHaveProperty('id');
  expect(findUser('invalid')).toBeNull();
  expect(deleteUser('nonexistent')).toBe(false);
  // If line 2 fails, we don't know if lines 1 and 3 work
});
```

### GOOD: One behavior per test
```typescript
// GOOD: Each test verifies one thing
it('creates a user with an id', () => { ... });
it('returns null for nonexistent users', () => { ... });
it('returns false when deleting nonexistent user', () => { ... });
```

## [CUSTOMIZE] Project-Specific Testing

Add your project-specific testing requirements here:
- Test framework configuration
- Mock setup patterns
- E2E test scenarios
