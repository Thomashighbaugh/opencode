---
name: typescript-interface-vs-type
description: TypeScript best practices covering interface vs type, utility types, discriminated unions, generics, and strict mode configuration. Use when reviewing TypeScript code, designing types, or configuring tsconfig.
level: 2
license: MIT
---

# TypeScript Best Practices

Covers interface/type selection, utility types, discriminated unions, generic patterns, and strict mode configuration.

## When to Use

- Reviewing TypeScript code for type system consistency
- Choosing between `interface` and `type` in new code
- Designing discriminated unions and generic utilities
- Configuring tsconfig for strict mode
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

---

## Utility Types Reference

| Utility | Transform | Example |
|---------|-----------|---------|
| `Partial<T>` | All properties optional | `Partial<Config>` |
| `Required<T>` | All properties required | `Required<Config>` |
| `Readonly<T>` | All properties readonly | `Readonly<State>` |
| `Pick<T, K>` | Select keys | `Pick<User, 'id' \| 'name'>` |
| `Omit<T, K>` | Remove keys | `Omit<User, 'password'>` |
| `Record<K, V>` | Object with key type K, value type V | `Record<string, User>` |
| `Exclude<T, U>` | Remove from union | `Exclude<Status, 'error'>` |
| `Extract<T, U>` | Keep only union members in U | `Extract<Status, string>` |
| `NonNullable<T>` | Remove null/undefined | `NonNullable<string \| null>` |
| `ReturnType<T>` | Function return type | `ReturnType<typeof fetchUser>` |
| `Parameters<T>` | Function parameter tuple | `Parameters<typeof fn>` |
| `Awaited<T>` | Unwrap Promise | `Awaited<Promise<User>>` |

```typescript
// Practical example: API response with loading state
type ApiState<T> = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

// Discriminate by status
function renderState(state: ApiState<User>) {
  switch (state.status) {
    case 'idle': return null;
    case 'loading': return <Spinner />;
    case 'success': return <UserProfile user={state.data} />;
    case 'error': return <Error msg={state.error} />;
  }
}
```

---

## Discriminated Unions

### Pattern

A union type with a common literal field (`kind`, `type`, `status`) that TypeScript uses for narrowing:

```typescript
type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'square'; size: number }
  | { kind: 'rect'; width: number; height: number };

function area(s: Shape): number {
  switch (s.kind) {
    case 'circle': return Math.PI * s.radius ** 2;
    case 'square': return s.size ** 2;
    case 'rect':   return s.width * s.height;
  }
}
```

**Rules:**
- Discriminant field MUST be a literal type (string literal, number literal, boolean)
- Each variant has the discriminant PLUS its specific data
- Switch exhaustiveness: add `default: assertNever(s)` to catch missing cases

```typescript
function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${x}`);
}
```

### When to Use

- State machines (loading/success/error, connection states)
- Form field unions (text, number, select, checkbox with different payloads)
- Event handlers (different event types with different data)
- Redux actions / command patterns

---

## Generics Patterns

### Constrained Generics

```typescript
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// K is constrained to actual keys of T — type-safe access
```

### Generic Components (React)

```typescript
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

function List<T>({ items, renderItem }: ListProps<T>) {
  return <ul>{items.map(renderItem)}</ul>;
}

// Usage: <List items={users} renderItem={u => <li>{u.name}</li>} />
```

### Factory Functions

```typescript
function createStore<T>(initial: T) {
  let state = initial;
  return {
    getState: () => state,
    setState: (fn: (prev: T) => T) => { state = fn(state); },
  };
}
```

---

## Strict Mode Configuration

### Minimal Strict tsconfig

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### What `strict: true` enables

| Flag | Effect |
|------|--------|
| `strictNullChecks` | `null`/`undefined` are distinct types |
| `noImplicitAny` | Error on implicit `any` |
| `strictFunctionTypes` | Contravariant function parameter checks |
| `strictBindCallApply` | Type-safe `.bind()`, `.call()`, `.apply()` |
| `strictPropertyInitialization` | Class properties must be initialized |
| `noImplicitThis` | Error on `this` with implicit `any` |

### Patterns for Strict Compliance

```typescript
// Before: implicit any on callback parameter
items.forEach(item => console.log(item)); // ❌

// After: typed parameter
items.forEach((item: Item) => console.log(item)); // ✅

// Before: unchecked indexed access
const first = arr[0]; // string | undefined

// After: must handle undefined
const first = arr[0] ?? fallback; // ✅
```
