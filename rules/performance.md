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

## [CUSTOMIZE] Project-Specific Performance

Add your project-specific performance requirements here:
- Response time targets
- Bundle size limits
- Database query limits
