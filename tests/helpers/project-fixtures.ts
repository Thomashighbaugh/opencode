import * as fs from 'fs'
import * as path from 'path'
import { loadConfig, parseJsonc, type ConfigRoot } from './load-config'

/** Root of the tests directory */
const TESTS_ROOT = path.resolve(__dirname, '..')

/** Fixtures directory */
export const FIXTURES_DIR = path.join(TESTS_ROOT, 'project', 'fixtures')

/**
 * Get the path to a named fixture.
 */
export function fixturePath(name: string): string {
  return path.join(FIXTURES_DIR, name)
}

/**
 * Load a fixture's opencode config.
 * Returns null if the fixture doesn't have one.
 */
export function loadFixtureConfig(name: string): ConfigRoot | null {
  return loadConfig(fixturePath(name))
}

/**
 * Load and parse a fixture's opencode.jsonc.
 * Returns null if the fixture doesn't have one.
 */
export function loadFixtureJson(name: string): Record<string, unknown> | null {
  const cfg = loadFixtureConfig(name)
  return cfg?.config ?? null
}

/**
 * Resolve a fixture path relative to the fixture root.
 */
export function fixtureResolve(name: string, ...segments: string[]): string {
  return path.join(fixturePath(name), ...segments)
}

/**
 * Check if a fixture has a given sub-path.
 */
export function fixtureHas(name: string, ...segments: string[]): boolean {
  return fs.existsSync(fixtureResolve(name, ...segments))
}

/**
 * List all available fixtures.
 */
export function listFixtures(): string[] {
  if (!fs.existsSync(FIXTURES_DIR)) return []
  return fs.readdirSync(FIXTURES_DIR).filter((name) => {
    const full = path.join(FIXTURES_DIR, name)
    return fs.statSync(full).isDirectory()
  })
}
