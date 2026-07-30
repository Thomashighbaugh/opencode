---
name: api-design
description: tRPC conventions — procedure naming, input validation, error handling, middleware
tags: [typescript, trpc, api, conventions]
---

# tRPC Conventions

## Procedure Naming
- Group by resource: `user.list`, `user.create`, `user.byId`
- Verb-noun for mutations: `createPost`, `updateUser`
- Noun-only for queries: `postList`, `userById`
- Use `.query()` for reads, `.mutation()` for writes

## Input Validation
- Use Zod for input schemas on every procedure
- Co-locate schema with procedure or in `schema.ts`
- Use `.input(z.object({...}))` for structured inputs
- Validate output with `.output(z.object({...}))` for type safety

## Error Handling
- Use `TRPCError` with appropriate codes: `NOT_FOUND`, `UNAUTHORIZED`, `FORBIDDEN`, `BAD_REQUEST`
- Never leak internal error details to clients
- Use error formatters for consistent client response shape
- Log server-side errors with correlation IDs

## Middleware
- Auth middleware checks session before every protected procedure
- Rate limiting on mutation procedures
- Procedure-level caching with `@trpc/cache` for expensive queries
- Request ID logging middleware for debugging
