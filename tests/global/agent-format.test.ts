import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

const AGENTS_DIR = path.resolve(__dirname, '..', '..', 'agents')

function getAgentFiles(): Array<{ name: string; path: string; content: string }> {
  if (!fs.existsSync(AGENTS_DIR)) return []
  return fs.readdirSync(AGENTS_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const filePath = path.join(AGENTS_DIR, f)
      return {
        name: f.replace(/\.md$/, ''),
        path: filePath,
        content: fs.readFileSync(filePath, 'utf-8'),
      }
    })
}

function hasFrontmatter(content: string): boolean {
  return content.startsWith('---')
}

function extractFrontmatter(content: string): string | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  return match ? match[1] : null
}

function frontmatterHasField(fm: string, field: string): boolean {
  // Match `field:` or `field :` at start of line
  return new RegExp(`^${field}\\s*:`, 'm').test(fm)
}

describe('agent format compliance', () => {
  const agents = getAgentFiles()

  it('finds agent files to test', () => {
    expect(agents.length).toBeGreaterThan(0)
  })

  describe('YAML frontmatter', () => {
    it.each(agents)('$name has YAML frontmatter', ({ name, content }) => {
      expect(hasFrontmatter(content), `${name}: missing --- start`).toBe(true)
    })

    it.each(agents)('$name has parseable frontmatter', ({ name, content }) => {
      const fm = extractFrontmatter(content)
      expect(fm, `${name}: cannot parse frontmatter`).not.toBeNull()
    })
  })

  describe('required frontmatter fields', () => {
    it.each(agents)('$name has description in frontmatter', ({ name, content }) => {
      const fm = extractFrontmatter(content)
      expect(fm, `${name}: no frontmatter`).not.toBeNull()
      expect(frontmatterHasField(fm!, 'description'), `${name}: missing description:`).toBe(true)
    })

    it.each(agents)('$name has model in frontmatter', ({ name, content }) => {
      const fm = extractFrontmatter(content)
      expect(fm, `${name}: no frontmatter`).not.toBeNull()
      expect(frontmatterHasField(fm!, 'model'), `${name}: missing model:`).toBe(true)
    })

    it.each(agents)('$name has mode in frontmatter', ({ name, content }) => {
      const fm = extractFrontmatter(content)
      expect(fm, `${name}: no frontmatter`).not.toBeNull()
      expect(frontmatterHasField(fm!, 'mode'), `${name}: missing mode:`).toBe(true)
    })
  })

  describe('Agent_Prompt XML wrapper', () => {
    it.each(agents)('$name has <Agent_Prompt> opening tag', ({ name, content }) => {
      expect(content, `${name}: missing <Agent_Prompt>`).toContain('<Agent_Prompt>')
    })

    it.each(agents)('$name has </Agent_Prompt> closing tag', ({ name, content }) => {
      expect(content, `${name}: missing </Agent_Prompt>`).toContain('</Agent_Prompt>')
    })
  })

  describe('Role sub-tag', () => {
    it.each(agents)('$name has <Role> opening tag', ({ name, content }) => {
      expect(content, `${name}: missing <Role>`).toContain('<Role>')
    })

    it.each(agents)('$name has </Role> closing tag', ({ name, content }) => {
      expect(content, `${name}: missing </Role>`).toContain('</Role>')
    })
  })
})
