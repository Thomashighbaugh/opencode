import { describe, expect, test } from "vitest"

import AxGuard from "../../plugins/ax-guard/index"
import { axGuard } from "../../plugins/ax-guard/guard"

describe("axGuard", () => {
  test("rejects curl and wget against a URL", () => {
    expect(axGuard("curl https://api.example.com/items")).toContain("Use ax")
    expect(axGuard("wget https://example.com/page.html")).toContain("Use ax")
    expect(axGuard("cd /tmp && curl https://example.com")).toContain("Use ax")
  })

  test("rejects throwaway HTTP parsers", () => {
    expect(axGuard(`python3 -c "import requests; print(requests.get('https://x').text)"`)).toContain("Use ax")
    expect(axGuard(`python3 - <<'PY'\nimport urllib.request\nurllib.request.urlopen('https://x')\nPY`)).toContain("Use ax")
    expect(axGuard(`node -e "fetch('https://x').then(r=>r.text()).then(console.log)"`)).toContain("Use ax")
  })

  test("allows ax, local work, and curl without a URL", () => {
    expect(axGuard("ax https://example.com --md")).toBeNull()
    expect(axGuard("ax https://api.example.com --body")).toBeNull()
    expect(axGuard("git status --short")).toBeNull()
    expect(axGuard("python3 scripts/analyze.py report.json")).toBeNull()
    expect(axGuard("curl --version")).toBeNull()
    expect(axGuard("")).toBeNull()
  })

  test("does not match a URL that merely appears inside echo/git text", () => {
    expect(axGuard("echo 'curl https://example.com'")).toBeNull()
    expect(axGuard("git commit -m 'document the https://example.com endpoint'")).toBeNull()
  })
})

describe("ax-guard wiring", () => {
  test("throws from the V2 before-hook for a curl command", async () => {
    const hooks = new Map<string, (event: any) => unknown>()
    const ctx = {
      tool: {
        hook: async (name: string, fn: (event: any) => unknown) => {
          hooks.set(name, fn)
        },
      },
    }
    await (AxGuard as any).setup(ctx)
    const before = hooks.get("execute.before")!
    expect(() => before({ tool: "bash", input: { command: "curl https://example.com" } })).toThrow(/Use ax/)
    expect(() => before({ tool: "bash", input: { command: "ax https://example.com --md" } })).not.toThrow()
    expect(() => before({ tool: "read", input: { command: "curl https://example.com" } })).not.toThrow()
  })
})
