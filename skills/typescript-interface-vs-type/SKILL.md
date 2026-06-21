---
name: typescript-interface-vs-type
description: Guidance on when to use `interface` vs `type` in TypeScript. Use when reviewing TypeScript code, choosing between interface and type alias, or evaluating type system usage.
---

# TypeScript: `interface` vs `type`

Quick-reference guide for choosing between `interface` and `type` aliases in TypeScript.

## When to Use

- Reviewing TypeScript code for type system consistency
- Choosing between `interface` and `type` in new code
- Evaluating whether declaration merging or intersection behavior is needed
- Code review feedback on type definitions

---

## Decision Matrix

| Criterion | Prefer `interface` | Prefer `type` |
|-----------|-------------------|---------------|
| Declaration merging | ✅ Yes — interfaces merge | ❌ No — type aliases error on duplicate |
| Extending other types | ✅ `extends` (cleaner errors) | ⚠️ `&` intersection (can mask conflicts) |
| Union/intersection of primitives | ❌ Not supported | ✅ `type Status = 'idle' \| 'loading'` |
| Mapped types / conditional types | ❌ Not supported | ✅ `type Readonly<T> = { readonly [K in keyof T]: T[K] }` |
| Tuple types | ⚠️ Works but verbose | ✅ `type Pair = [string, number]` |
| Performance (large unions) | ✅ Faster for object shapes | ⚠️ Can be slower with `&` on many types |
| Function types | ✅ `interface Fn { (x: number): void }` | ✅ `type Fn = (x: number) => void` |
| Class `implements` | ✅ Preferred | ✅ Works, but less idiomatic |

---

## Declaration Merging

**`interface`** declarations with the same name in the same scope **merge** automatically:

```typescript
interface User {
  name: string;
}
interface User {
  age: number;
}
// Result: User has both name AND age
```

**`type`** aliases **cannot** be redeclared:

```typescript
type User = { name: string };
type User = { age: number }; // ❌ Error: Duplicate identifier 'User'
```

**When to use merging:** Augmenting third-party library types (e.g., adding properties to `Window`, `ProcessEnv`, or library module declarations).

---

## Extends vs Intersection

### `interface` extends

```typescript
interface Base { name: string }
interface Derived extends Base { age: number }
// Derived: { name: string; age: number }
```

### `type` intersection (`&`)

```typescript
type Base = { name: string }
type Derived = Base & { age: number }
// Derived: { name: string; age: number }
```

### Key difference: Conflict handling

```typescript
interface A { x: string }
interface B { x: number }
// ❌ Error: 'x' declared with incompatible types

type A = { x: string }
type B = { x: number }
type C = A & B; // ✅ No error — x becomes `never` (string & number)
```

**Rule of thumb:** `extends` gives clearer compiler errors on conflicts. `&` silently produces `never` for conflicting properties, which can mask bugs.

---

## When to Prefer `interface`

1. **Public API / library types** — consumers may want to augment via declaration merging
2. **Object shapes** that are extended by other interfaces
3. **Class contracts** — `implements` reads more naturally with `interface`
4. **Team convention** — many style guides (Google, Microsoft) default to `interface` for objects

## When to Prefer `type`

1. **Unions** — `type Status = 'idle' | 'loading' | 'success' | 'error'`
2. **Intersection of primitives** — `type ID = string | number`
3. **Mapped/conditional types** — `type Getters<T> = { [K in keyof T]: () => T[K] }`
4. **Tuple types** — `type Point = [number, number, number]`
5. **Function overloads as intersection** — `type Fn = ((a: string) => void) & ((b: number) => void)`
6. **Utility types** — extracting or transforming other types

---

## Performance Considerations

- **`interface`** is generally faster for the compiler on object types — it uses a cached "declared" form
- **`type` intersections** (`&`) can be slower on large, deeply nested unions because the compiler must evaluate the full intersection
- For **large discriminated unions** (50+ members), prefer `interface` with `extends` over `type` with `&`
- In practice, the difference is negligible for most codebases. Only optimize when you measure a bottleneck.

---

## Conventions

### TypeScript Handbook Recommendation

> "Use `interface` until you need to use `type`."

### Popular Style Guides

| Guide | Default for Objects | Default for Unions |
|-------|-------------------|-------------------|
| TypeScript Handbook | `interface` | `type` |
| Google TS Style | `interface` | `type` |
| Microsoft TS Style | `interface` | `type` |
| Prettier (no opinion) | — | — |

---

## Quick Reference

```typescript
// ✅ interface — object shapes, public APIs, class contracts
interface Props {
  title: string;
  onClick: () => void;
}

// ✅ type — unions, tuples, mapped types, utility types
type Status = 'idle' | 'loading' | 'error';
type Pair<T> = [T, T];
type ReadonlyProps = Readonly<Props>;

// ⚠️ Both work for simple object types — pick one per project
// ✅ interface for extends, ✅ type for intersection
```
