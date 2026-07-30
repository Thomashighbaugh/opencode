---
name: nextjs-conventions
description: Next.js App Router conventions — server components by default, route handlers, data fetching patterns
tags: [nextjs, react, conventions]
---

# Next.js Conventions

## Component Architecture
- **Server components by default** — only add `'use client'` when you need interactivity (hooks, event handlers, browser APIs)
- Client components should be leaf nodes in the component tree; push data fetching up to server components
- Use React Server Components (RSC) for data fetching — no `useEffect` for API calls

## Routing
- App Router (`app/` directory) is the default
- Route groups `(group)` for organizational structure
- Parallel routes `@slot` for complex layouts
- Intercepting routes `(..)` for modal patterns

## Data Fetching
- Prefer `async` server components with direct database access
- Use `fetch()` with `cache: 'force-cache'` (default) for static data
- Use `fetch()` with `cache: 'no-store'` or `next: { revalidate }` for dynamic data
- Server Actions for mutations — `'use server'` in separate files

## API Routes
- Route handlers in `app/api/**/route.ts`
- Export named functions: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`
- Validate with Zod schemas
- Return `NextResponse` or `NextResponse.json()`

## Styling
- Tailwind CSS utility classes over custom CSS
- CSS Modules for complex component-specific styles
- Use `cn()` utility for conditional class merging (clsx + tailwind-merge)
- Avoid inline styles except for dynamic values

## Imports
- Use `@/` absolute import alias
- Order: external libraries → internal modules → types/interfaces
- Barrel exports from `index.ts` files for public module APIs

## Nix Flake Development Shell
- A `flake.nix` is provided for reproducible Node.js + pnpm + toolchain
- Use `nix develop` to enter the shell — pnpm, TypeScript LSP, and Tailwind LSP are pre-installed
- Run `pnpm install` after entering the shell for the first time
- CI commands: `nix develop --command pnpm build`, `nix develop --command pnpm test`
