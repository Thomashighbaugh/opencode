---
name: framework-conventions
description: Next.js App Router conventions — server components, data fetching, routing, server actions
tags: [nextjs, react, conventions, framework]
---

# Next.js Framework Conventions

## Component Architecture
- Server components by default; only add `'use client'` when interactivity is required
- Client components are leaf nodes — push data fetching up to server components
- Use React Server Components for data fetching instead of `useEffect`

## Routing
- App Router (`app/` directory) is the default
- Route groups `(group)` for organizational structure
- Parallel routes `@slot` for complex layouts
- Intercepting routes `(..)` for modal patterns over URL-based navigation

## Data Fetching
- `async` server components with direct database or API access
- Use `fetch()` with `cache: 'force-cache'` for static data (default)
- Use `cache: 'no-store'` or `next: { revalidate }` for dynamic data
- Server Actions for mutations — `'use server'` in standalone files

## API Routes
- Route handlers in `app/api/**/route.ts`
- Export named functions: `GET`, `POST`, `PUT`, `DELETE`
- Validate inputs with Zod schemas
- Return `NextResponse` or `NextResponse.json()`
