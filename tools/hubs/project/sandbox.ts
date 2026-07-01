import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "sandbox",
  description: "Sandbox enforcement — policy-based tool control, file protection, network filtering for agent tool calls",
  reminder: "Enforce sandbox tool execution policies.",
  inline: true,

  detailedDescription: `Sandbox enforcement for agent tool calls. Applies policies:

- Tool control: allow/deny specific tools (e.g. no bash in production).
- File protection: mark files as read-only or no-touch (e.g. don't modify .env, production config).
- Network filtering: restrict network access (e.g. no external fetches in CI).
- Rate limiting: cap tool calls per minute.

The sandbox is policy-driven — you define what's restricted, the sandbox enforces it. Use in CI, production environments, or when an agent might touch files it shouldn't.`,

  tools: ["bash"],
  rules: ["security"],
  relatedSkills: [],
}

export default spec