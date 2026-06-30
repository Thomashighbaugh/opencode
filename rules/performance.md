# Performance Rules

## Model Selection Strategy

**Fast/Lightweight Models** (Cost-efficient, good for most tasks):
- Lightweight agents with frequent invocation
- Code generation and exploration
- Worker agents in multi-agent systems

**Balanced Models** (Best coding performance):
- Main development work
- Orchestrating multi-agent workflows
- Complex coding tasks

**Deep Reasoning Models** (Maximum capability):
- Complex architectural decisions
- Maximum reasoning requirements
- Research and analysis tasks

## Context Window Management

Avoid last 20% of context window for:
- Large-scale refactoring
- Feature implementation spanning multiple files
- Debugging complex interactions

## Algorithm Efficiency

Before implementing:
- [ ] Consider time complexity
- [ ] Avoid O(n^2) when O(n log n) possible
- [ ] Use appropriate data structures
- [ ] Cache expensive computations

## Examples

### BAD: Premature optimization
```typescript
// BAD: Optimizing before measuring
const optimizedUserMap = new Map(users.map(u => [u.id, u]));
// vs a simple loop, when users.length is always < 50
```

### GOOD: Measure first, optimize based on data
```typescript
// GOOD: Start simple, profile, then optimize if needed
function findUser(users: User[], id: string) {
  return users.find(u => u.id === id);
}
// If profiling shows this is a bottleneck, then optimize
```

### BAD: N+1 in loops
```typescript
// BAD: Database query in a loop
for (const user of users) {
  const posts = await db.posts.findByUserId(user.id); // N queries
}
```

### GOOD: Batch queries
```typescript
// GOOD: Single batch query
const posts = await db.posts.findByUserIds(users.map(u => u.id));
```

## [CUSTOMIZE] Project-Specific Performance

Add your project-specific performance requirements here:
- Response time targets
- Bundle size limits
- Database query limits
