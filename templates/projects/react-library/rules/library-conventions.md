---
name: library-conventions
description: React library conventions — component API design, bundling, tree-shaking, Storybook
tags: [react, library, conventions]
---

# React Library Conventions

## Component API Design
- Components accept a single `props` object with TypeScript interface
- Use `React.forwardRef` for components that need ref access
- Use `React.memo` for expensive renders — measure first, optimize second
- Support `className` and `style` props for customization
- Export types alongside components: `import { Button, ButtonProps } from './button'`

## Bundling
- Use Rollup or Vite library mode for production bundles
- Output ESM (`"type": "module"`) and CJS formats
- Tree-shakeable by default — one entry point per component or barrel export
- Generate `.d.ts` declaration files
- Include sourcemaps

## Storybook
- One `.stories.tsx` file per component
- Cover: default state, variants, edge cases (empty, loading, error, long text)
- Use `argTypes` for documentation
- Write play functions for interaction tests

## Testing
- `@testing-library/react` for component tests
- Test: renders, interactions, accessibility (jest-axe)
- Snapshot tests for visual regression (check-in with `--update` flag)
- Co-locate test files with components

## Nix Flake Development Shell
- A `flake.nix` is provided for reproducible Node.js + pnpm + TypeScript toolchain
- Use `nix develop` to enter the shell — pnpm, TypeScript LSP, and VSCode language servers pre-installed
- Run `pnpm install` after entering the shell for the first time
- CI commands: `nix develop --command pnpm build`, `nix develop --command pnpm test`
