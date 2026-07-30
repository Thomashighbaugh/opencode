---
name: react-key-prop
description: React best practices covering key prop reconciliation, component patterns, performance optimization, and hooks rules. Use when reviewing React code, troubleshooting rendering bugs, or writing new components.
level: 2
license: MIT
---

# React Best Practices

Covers key prop reconciliation, component architecture, performance patterns, and hooks conventions.

## When to Use

- Reviewing React components that render lists with `.map()`
- Troubleshooting stale state, incorrect reordering, or unnecessary remounts
- Evaluating component architecture and composition patterns
- Checking hooks rule compliance in code review
- Onboarding developers to React reconciliation behavior

---

## Core Principle

**Keys must be stable, unique, and predictable.** They tell React how to match elements between renders during reconciliation.

```typescript
// ✅ Good: stable, unique, predictable
items.map((item) => <ListItem key={item.id} item={item} />);

// ❌ Bad: unstable, changes every render
items.map((item, index) => <ListItem key={index} item={item} />);

// ❌ Bad: non-unique
items.map((item) => <ListItem key={item.type} item={item} />);

// ❌ Bad: random — causes full remount every render
items.map((item) => <ListItem key={Math.random()} item={item} />);
```

---

## The Index-as-Key Anti-Pattern

Using array index as key is the most common React key bug.

### When it breaks

| Scenario | Effect |
|----------|--------|
| Items reordered | React reuses wrong component instances — state, refs, and DOM attached to wrong items |
| Items inserted/deleted at start | All subsequent indices shift — every component remounts or gets wrong state |
| List is filtered | Same index shift problem |
| Items have local state (inputs, checkboxes) | State persists on wrong elements — user sees stale/incorrect data |

### When it's acceptable (rare)

- Static list that never changes order or length
- Items have no local state, refs, or side effects
- List is read-only display (no inputs, no animations)

```typescript
// ✅ Acceptable: static, read-only, never changes
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
days.map((day, i) => <span key={i}>{day}</span>);
```

---

## Stable Key Sources

| Source | Stable? | Notes |
|--------|---------|-------|
| Database ID (`item.id`) | ✅ Yes | Best choice — unique, stable, persistent |
| UUID generated at creation | ✅ Yes | Good for optimistic UI before server response |
| Content hash | ✅ Yes | Works when no ID exists — hash of item content |
| Array index | ❌ No | Breaks on reorder/insert/delete |
| `Math.random()` | ❌ No | Changes every render — full remount |
| `Date.now()` | ❌ No | Changes every render — full remount |
| `crypto.randomUUID()` | ❌ No | Changes every render — full remount |

---

## Key Placement

Keys belong on the **element returned from `.map()`**, not on nested children:

```typescript
// ✅ Correct: key on the outermost returned element
items.map((item) => (
  <div key={item.id}>
    <ListItem item={item} />
  </div>
));

// ❌ Wrong: key on a child, not the map return
items.map((item) => (
  <div>
    <ListItem key={item.id} item={item} />
  </div>
));

// ✅ Correct: key on Fragment shorthand (<> doesn't accept key)
items.map((item) => (
  <React.Fragment key={item.id}>
    <dt>{item.term}</dt>
    <dd>{item.def}</dd>
  </React.Fragment>
));
```

### Key on custom components

Keys are **not** passed as props — they're internal to React's reconciliation:

```typescript
function ListItem({ item }: { item: Item }) {
  // ❌ Can't access props.key — it's reserved
  return <div>{item.name}</div>;
}

// ✅ Key is set on the JSX element, not inside the component
items.map((item) => <ListItem key={item.id} item={item} />);
```

---

## Reconciliation Behavior

| Key change | React behavior |
|------------|----------------|
| Same key, same position | Re-render (update existing instance) |
| Same key, different position | Move (reorder DOM nodes, preserve state) |
| Different key | Unmount old, mount new (reset all state) |
| Key removed | Unmount (destroy state, refs, effects) |

---

## Common Pitfalls

### 1. Using `key` to force remount

Sometimes you want a fresh component instance (e.g., resetting a form):

```typescript
// Remounts UserForm when userId changes — resets all internal state
<UserForm key={userId} userId={userId} />
```

### 2. Non-unique keys from partial data

```typescript
// ❌ Bad: type is not unique across items
items.map((item) => <Item key={item.type} />);

// ✅ Good: combine with another field
items.map((item) => <Item key={`${item.type}-${item.id}`} />);
```

### 3. Key on Fragment shorthand

```typescript
// ❌ Syntax error: <> doesn't accept key
items.map((item) => (
  < key={item.id}>  {/* ❌ */}
    <dt>{item.term}</dt>
    <dd>{item.def}</dd>
  </>
));

// ✅ Use React.Fragment
items.map((item) => (
  <React.Fragment key={item.id}>
    <dt>{item.term}</dt>
    <dd>{item.def}</dd>
  </React.Fragment>
));
```

### 4. Key on array of primitives

```typescript
// ✅ React uses the value itself as key for primitives
const numbers = [1, 2, 3];
numbers.map((n) => <li>{n}</li>);
// React internally uses the value as key when none is provided
// But explicit key is still better for clarity
```

---

## Quick Reference

```typescript
// ✅ DO: stable unique ID
items.map((item) => <Item key={item.id} item={item} />);

// ✅ DO: content hash when no ID
items.map((item) => <Item key={hashContent(item)} item={item} />);

// ✅ DO: composite key when needed
items.map((item) => <Item key={`${item.type}-${item.seq}`} item={item} />);

// ✅ DO: key on Fragment for multiple elements
items.map((item) => (
  <React.Fragment key={item.id}>
    <ChildA item={item} />
    <ChildB item={item} />
  </React.Fragment>
));

// ❌ DON'T: array index (unless static read-only list)
items.map((item, i) => <Item key={i} item={item} />);

// ❌ DON'T: random/date keys
items.map((item) => <Item key={Math.random()} item={item} />);

// ❌ DON'T: key on child instead of map return
items.map((item) => (
  <div>
    <Item key={item.id} item={item} />
  </div>
));
```

---

## Component Composition Patterns

### Props vs Children

| Pattern | Use When | Example |
|---------|----------|---------|
| **Props** | Data-driven, known shape | `<Card title={t} body={b} />` |
| **Children** | Flexible layout, unknown content | `<Card><p>Any JSX</p></Card>` |
| **Render props** | Shared logic, varying render | `<DataProvider render={data => <View {...data} />} />` |

### Controlled vs Uncontrolled

```typescript
// Controlled — state managed by parent
function Input({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <input value={value} onChange={e => onChange(e.target.value)} />;
}

// Uncontrolled — state managed internally via ref
function FileInput() {
  const ref = useRef<HTMLInputElement>(null);
  return <input ref={ref} type="file" />;
}
```

**Rule:** Prefer controlled for form inputs. Use uncontrolled for file inputs, media playback, and third-party DOM interop.

### Lifting State Up

Duplicate or derived state across siblings → lift to the nearest common ancestor:

```typescript
function Parent() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  return (
    <>
      <List onSelect={setSelectedId} />
      <Detail id={selectedId} />
    </>
  );
}
```

---

## Hooks Rules & Patterns

### Rules of Hooks

1. **Only call hooks at the top level** — not inside conditions, loops, or callbacks
2. **Only call hooks from React functions** — components or custom hooks, not regular JS functions

### Common Custom Hooks

```typescript
// Debounced value
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// Toggle
function useToggle(initial = false) {
  return useReducer(state => !state, initial);
}
```

### Effect Cleanup

Every `useEffect` that subscribes, sets intervals, or starts async work MUST return a cleanup:

```typescript
useEffect(() => {
  const sub = source.subscribe(data => setData(data));
  return () => sub.unsubscribe(); // ✅ cleanup
}, [source]);
```

Missing cleanup → memory leaks, stale closures, duplicate subscriptions on StrictMode re-mounts.

---

## Performance Patterns

| Pattern | Problem | Solution |
|---------|---------|----------|
| `React.memo` | Unnecessary re-renders of pure presentational components | Wrap leaf components with stable props |
| `useMemo` | Expensive computations re-running | Memoize derived data |
| `useCallback` | Callback identity changing every render | Stable function reference for memo children |
| Lazy loading | Large component bundles | `React.lazy(() => import('./BigComponent'))` |

```typescript
// Before: re-renders on every parent render
function ExpensiveList({ items }: { items: Item[] }) { /* ... */ }

// After: skips re-render if items reference hasn't changed
const ExpensiveList = React.memo(function ExpensiveList({ items }: { items: Item[] }) {
  return /* ... */;
});
```
