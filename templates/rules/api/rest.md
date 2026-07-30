---
name: api-design
description: REST API conventions — URL naming, versioning, pagination, error format, status codes
tags: [api, rest, conventions]
---

# REST API Conventions

## URL Naming
- Plural nouns for collections: `/users`, `/articles`
- Singular for detail: `/users/{id}`
- Nest for sub-resources: `/users/{id}/posts`
- Hyphens for multi-word: `/blog-posts`
- No file extensions: `/users` not `/users.json`

## Versioning
- Prefix with `v1`, `v2`: `/api/v1/users`
- Never version by header or query parameter
- Maintain backwards compatibility within a version
- Deprecate with `Sunset` header and migration guide

## Status Codes
- `200` GET success, PUT/PATCH success
- `201` POST created
- `204` DELETE success, no content
- `400` Validation error
- `401` Unauthenticated
- `403` Forbidden
- `404` Resource not found
- `409` Conflict (duplicate, stale version)
- `422` Unprocessable entity (validation)
- `429` Rate limited
- `5xx` Server errors (don't leak details)

## Error Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description",
    "details": [
      { "field": "email", "issue": "must be a valid email" }
    ]
  }
}
```

## Pagination
- Cursor-based for large lists, offset-based for simple pagination
- Response includes `next_cursor` / `previous_cursor`
- Default page size 20, max 100
- Include total count only when cheap to compute
