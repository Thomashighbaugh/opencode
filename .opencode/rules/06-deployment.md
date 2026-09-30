# Deployment & CI/CD Conventions

Auto-generated from codebase analysis.

## CI/CD

- Platform: GitHub Actions
- Pipeline: lint → test → build → deploy

## Deployment Target

- Deployment: Not fully configured

## Pre-Deploy Checklist

1. All tests pass
2. Lint clean
3. Build succeeds
4. Migrations up-to-date
5. Environment variables configured
