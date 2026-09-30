import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    include: ['tests/**/*.test.ts'],
    // The default 5s is too tight for anything that touches the vector or graph
    // subsystem: a cold retriever pays ~6.6s of ONNX model load in a child
    // process. A test that exercises it fails on the timeout rather than on its
    // assertion, which reads as "retrieval is broken" when it is merely slow.
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
})
