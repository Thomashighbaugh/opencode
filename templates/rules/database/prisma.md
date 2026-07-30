---
name: database-conventions
description: Prisma conventions — schema naming, relations, migrations, seeding, query patterns
tags: [prisma, database, conventions]
---

# Prisma Conventions

## Schema Naming
- Models are singular PascalCase: `User`, `BlogPost`, `Comment`
- Table names follow model names (Prisma defaults to pluralized)
- Fields are camelCase: `firstName`, `createdAt`
- Relations are camelCase: `author`, `posts`, `comments`

## Relations
- Always define both sides of a relation for type safety
- Use `@@index()` for frequently queried fields
- Use `onDelete: Cascade` for owned relations, `SetNull` for optional
- Avoid circular relations — use relation fields sparingly

## Migrations
- One migration per logical change (not per commit)
- Name migrations descriptively: `add_user_avatar_field`
- Review generated SQL before applying
- Never edit migration files after they're applied

## Seeding
- Use `prisma/seed.ts` with `ts-node` or `tsx`
- Use `upsert` over `create` for idempotent seeds
- Seed data mirrors production patterns (same edge cases)
- Run seed after migration in development

## Query Patterns
- Use `include` and `select` to limit fetched data
- Use `transaction` API for atomic operations
- Batch inserts with `createMany` over looped `create`
- Use `raw` queries only when Prisma API can't express the query
