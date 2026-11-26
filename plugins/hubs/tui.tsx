/**
 * TUI entrypoint (OpenCode 2).
 *
 * Faces:
 *   /<hub-name>        → picker over that hub's subcommands, submits the routed payload
 *   /hubs             → submits the hub index
 *   /hubs-skills      → hub-owned skill browser: preview (ctrl+p), insert @mention (ctrl+m)
 *   /hubs-settings    → display scope + token estimates
 *   sidebar           → skill list with loaded marks, hub tags, token estimates
 *
 * The picker is the reason this package exists: MCP prompts are flat commands,
 * and the host exposes no selection API through MCP. `ui.dialog.select` is the
 * only searchable chooser in V2.
 */

import { For, Show, createEffect, createMemo, createSignal } from "solid-js"
import type { Plugin } from "@opencode/plugin/tui"

import { hub, hubNames, render, renderIndex, route, getDelegation } from "./src/core"
import { loadSubcommandSpecFull } from "./data/hub-data"
import {
  extractLoadedSkills,
  formatTokenCount,
  loadVendoredSkills,
  visibleSkills,
  type SkillScope,
  type VendoredSkill,
} from "./src/skills"

const definePlugin = (plugin: Plugin.Definition): Plugin.Definition => plugin

type Prefs = { collapsed: boolean; scope: SkillScope; tokens: boolean }

function themeColor(color: any, fallback: string): string | undefined {
  try {
    if (color == null) return fallback
    // OpenTUI <text fg={...}> accepts string | RGBA directly
    return color
  } catch {
    return fallback
  }
}

export default definePlugin({
  id: "hubs",
  setup(ctx) {
    const directory: string | undefined = ctx.location?.directory
    if (directory) process.env.HUBS_PROJECT_ROOT = directory

    const [prefs, mutatePrefs] = ctx.storage.store<Prefs>("prefs", {
      initial: { collapsed: false, scope: "hubs", tokens: true },
    })
    const [loaded, setLoaded] = createSignal<ReadonlySet<string>>(new Set<string>())
    // Which hub menus are expanded in the sidebar. Left click toggles; right click
    // opens the picker (the same dialog the MCP list opens).
    const [expanded, setExpanded] = createSignal<ReadonlySet<string>>(new Set<string>())
    const toggleMenu = (name: string) =>
      setExpanded((previous) => {
        const next = new Set(previous)
        if (next.has(name)) next.delete(name)
        else next.add(name)
        return next
      })

    const toast = (message: string, variant: "info" | "warning" | "error" = "info") =>
      ctx.ui.toast.show({ title: "Hubs", message, variant })

    const submit = async (text: string) => {
      let route = ctx.ui.router.current()
      let sessionID = route?.type === "session" ? route.sessionID : undefined
      if (!sessionID) {
        try {
          const created = await (ctx.client.session.create as any)({ directory, title: "hubs" })
          sessionID = (created as any)?.data?.id ?? (created as any)?.id
          if (sessionID && typeof (ctx.ui.router as any).navigate === "function") {
            try { (ctx.ui.router as any).navigate({ type: "session", sessionID }) } catch {}
          }
        } catch (error) {
          toast(`Could not create session: ${error instanceof Error ? error.message : String(error)}`, "error")
          return
        }
      }
      if (!sessionID) return toast("Open a session first", "warning")
      try {
        await ctx.client.session.prompt({ sessionID, text, resume: true, delivery: "steer" })
      } catch (error) {
        toast(`Could not submit: ${error instanceof Error ? error.message : String(error)}`, "error")
      }
    }

    // A subcommand is a prefix, not the whole request: ask for the task text
    // before submitting the routed payload.
    const askAndSubmit = async (payload: string, title: string) => {
      const task = await ctx.ui.dialog.prompt({
        title,
        placeholder: "Describe the task (Enter to send, Esc to cancel)",
      })
      if (task === undefined) return
      const body = task.trim() ? `${payload}\n\n${task.trim()}` : payload
      await submit(body)
    }

    // ───────── full-definition popup (ctrl+s) ─────────

    function formatFullDefinition(name: string, full: NonNullable<ReturnType<typeof loadSubcommandSpecFull>>): string {
      const { spec, rulesContent, relatedSkillMeta } = full
      if (!spec) return `No definition found for ${name}`

      const lines: string[] = []
      lines.push(`${spec.label} — ${name}`)
      lines.push("")
      lines.push(`Description: ${spec.description}`)
      lines.push(`Reminder: ${spec.reminder}`)
      if (spec.inline) lines.push(`Inline: yes`)
      if (spec.phases) lines.push(`Phases: ${spec.phases}`)

      const delegation = getDelegation(spec)
      const delegationLabel =
        delegation.type === "skill" ? `skill: ${delegation.target}`
        : delegation.type === "agent" ? `agent: ${delegation.target}`
        : delegation.type === "command" ? `command: ${delegation.target}`
        : "inline (handled by hubs)"
      lines.push(`Delegation: ${delegationLabel}`)

      lines.push("")
      lines.push("## Detailed Description")
      lines.push(spec.detailedDescription || "")

      if (spec.tools?.length) {
        lines.push("")
        lines.push(`## Tools: ${spec.tools.join(", ")}`)
      }
      if (spec.rules?.length) {
        lines.push("")
        lines.push(`## Rules: ${spec.rules.join(", ")}`)
      }
      if (spec.relatedSkills?.length) {
        lines.push("")
        lines.push(`## Related Skills: ${spec.relatedSkills.join(", ")}`)
      }

      if (rulesContent?.length) {
        lines.push("")
        lines.push("## Inlined Rules")
        for (const rule of rulesContent) {
          lines.push(`### ${rule.name}`)
          lines.push(rule.content)
        }
      }

      if (relatedSkillMeta?.length) {
        lines.push("")
        lines.push("## Related Skill Details")
        for (const skill of relatedSkillMeta) {
          lines.push(`### ${skill.name}`)
          lines.push(skill.description || "")
        }
      }

      if (spec.examples?.length) {
        lines.push("")
        lines.push("## Examples")
        for (const ex of spec.examples) {
          lines.push(`- Input: ${ex.input}`)
          lines.push(`  Approach: ${ex.approach}`)
        }
      }

      if (spec.warnings?.length) {
        lines.push("")
        lines.push("## Warnings")
        for (const w of spec.warnings) {
          lines.push(`- ${w}`)
        }
      }

      return lines.join("\n")
    }

    function showDefinitionPopup(name: string, subLabel: string) {
      const full = loadSubcommandSpecFull(name, subLabel)
      const body = formatFullDefinition(name, full)
      ctx.ui.dialog.show(() => (
        <scrollbox width="100%" height="100%" scrollY>
          <box flexDirection="column" padding={1}>
            <text fg={ctx.theme.text.muted}>{body}</text>
          </box>
        </scrollbox>
      ))
      ctx.ui.dialog.set({ size: "xlarge", centered: true })
    }

    // ───────── hub subcommand picker ─────────

    async function openHub(name: string): Promise<"back" | void> {
      const definition = hub(name)
      if (!definition) return toast(`Unknown hub: ${name}`, "error")

      let showDefFor: string | null = null
      const choice = await ctx.ui.dialog.select<string | "back">({
        title: `${definition.name} — ${definition.subcommands.length} subcommands`,
        placeholder: "Filter subcommands",
        options: definition.subcommands.map((sub) => ({
          title: sub.label,
          value: sub.label,
          description: sub.description,
          category: sub.skill ? `skill: ${sub.skill}` : sub.command ? "command" : "prompt",
        })),
        search: (query, options) => {
          const needle = query.trim().toLowerCase()
          if (!needle) return options
          return options.filter((option) =>
            `${option.title} ${option.description ?? ""} ${option.category ?? ""}`.toLowerCase().includes(needle),
          )
        },
        actions: [
          {
            bind: "ctrl+l",
            title: "Index",
            side: "right",
            selection: "none",
            onTrigger: () => void submit(renderIndex()),
          },
          {
            bind: "ctrl+s",
            title: "Full definition",
            onTrigger: (subLabel) => { showDefFor = subLabel; return "back" as const },
          },
          {
            bind: "ctrl+," ,
            title: "Back to hubs",
            side: "right",
            selection: "none",
            onTrigger: () => "back" as const,
          },
        ],
      })

      if (showDefFor) {
        showDefinitionPopup(name, showDefFor)
        return
      }
      if (choice === "back" || choice === undefined) return "back"
      await askAndSubmit(render(route(name, choice)), `${definition.name} — ${choice}`)
    }

    function openPreview(skill: VendoredSkill) {
      const body = `${skill.id}  ·  ${formatTokenCount(skill.loadTokens)} tok  ·  ${skill.hubs.join(", ") || "unreferenced"}\n\n${skill.content}`
      ctx.ui.dialog.show(() => (
        <scrollbox width="100%" height="100%" scrollY>
          <box flexDirection="column" padding={1}>
            <text fg={ctx.theme.text.muted}>{body}</text>
          </box>
        </scrollbox>
      ))
      ctx.ui.dialog.set({ size: "xlarge", centered: true })
    }

    async function insertMention(skill: VendoredSkill) {
      const location = ctx.location ?? ctx.data.location.default()
      const registered = ctx.data.location.skill.list(location) ?? []
      const index = registered.findIndex((entry) => entry.id === skill.id)
      if (index < 0) return toast("Skill is not registered yet", "warning")
      if (!ctx.keymap.commands().some((command) => command.id === "prompt.skills")) {
        return toast("Native skill picker unavailable", "warning")
      }
      ctx.keymap.dispatch("prompt.skills")
      await new Promise((resolve) => setTimeout(resolve, 150))
      ctx.keymap.dispatch("dialog.select.home")
      for (let step = 0; step < index; step++) ctx.keymap.dispatch("dialog.select.next")
      ctx.keymap.dispatch("dialog.select.submit")
    }

    async function openSkills() {
      const location = ctx.location ?? ctx.data.location.default()
      try {
        await Promise.all([ctx.data.location.skill.sync(location), ctx.data.location.agent.sync(location)])
      } catch {}

      const skills = visibleSkills(prefs.scope, loaded())
      if (skills.length === 0) return toast("No hub skills in this scope", "warning")

      const choice = await ctx.ui.dialog.select<VendoredSkill>({
        title: `Hub skills — ${skills.length}`,
        placeholder: "Filter skills",
        options: skills.map((skill) => ({
          title: `${loaded().has(skill.id) ? "●" : "○"} ${skill.id}`,
          value: skill,
          description: skill.description,
          category: skill.hubs.slice(0, 2).join(", ") || "unreferenced",
        })),
        search: (query, options) => {
          const needle = query.trim().toLowerCase()
          if (!needle) return options
          return options.filter((option) =>
            `${option.title} ${option.description ?? ""}`.toLowerCase().includes(needle),
          )
        },
        actions: [
          {
            bind: "ctrl+p",
            title: "Preview",
            onTrigger: (skill) => openPreview(skill),
          },
          {
            bind: "ctrl+m",
            title: "Mention",
            side: "right",
            onTrigger: (skill) => void insertMention(skill),
          },
        ],
      })
      if (choice) openPreview(choice)
    }

    async function openSettings() {
      const scope = await ctx.ui.dialog.select<SkillScope>({
        title: "Skill scope",
        current: prefs.scope,
        options: [
          { title: "Hub-referenced", value: "hubs" as SkillScope, description: "Only skills a hub subcommand cites" },
          { title: "All vendored", value: "all" as SkillScope, description: "Every skill shipped with the package" },
          { title: "Loaded only", value: "loaded" as SkillScope, description: "Skills loaded in this session" },
        ],
      })
      if (scope) void mutatePrefs((draft) => void (draft.scope = scope))

      const tokens = await ctx.ui.dialog.select<boolean>({
        title: "Token estimates",
        current: prefs.tokens,
        options: [
          { title: "Show", value: true },
          { title: "Hide", value: false },
        ],
      })
      if (tokens !== undefined) void mutatePrefs((draft) => void (draft.tokens = tokens))
    }

    ctx.keymap.layer(() => ({
      mode: "global",
      commands: [
        ...hubNames().map((name) => ({
          id: `hubs.${name}`,
          title: `Hub: ${name}`,
          group: "Hubs",
          slash: { name },
          run: async () => {
            const result = await openHub(name)
            if (result === "back") await openHubPicker()
          },
        })),
        {
          id: "hubs.index",
          title: "Hubs — index",
          group: "Hubs",
          palette: true,
          slash: { name: "hubs", arguments: true },
          run: async (input) => {
            const target = input?.trim()
            if (target && hubNames().includes(target)) {
              const result = await openHub(target)
              if (result === "back") await openHubPicker()
            } else {
              await openHubPicker()
            }
          },
        },
        {
          id: "hubs.skills",
          title: "Hubs — skills",
          group: "Hubs",
          palette: true,
          slash: { name: "hubs-skills" },
          run: () => void openSkills(),
        },
        {
          id: "hubs.settings",
          title: "Hubs — sidebar settings",
          group: "Hubs",
          palette: true,
          slash: { name: "hubs-settings" },
          run: () => void openSettings(),
        },
      ],
    }))

    async function openHubPicker() {
      while (true) {
        const choice = await ctx.ui.dialog.select<string>({
          title: `Hubs — ${hubNames().length} menus`,
          placeholder: "Filter hubs",
          options: hubNames().map((name) => {
            const definition = hub(name)
            return {
              title: `/${name}`,
              value: name,
              description: definition?.description ?? "",
              category: `${definition?.subcommands.length ?? 0} subcommands`,
            }
          }),
          search: (query, options) => {
            const needle = query.trim().toLowerCase()
            if (!needle) return options
            return options.filter((option) =>
              `${option.title} ${option.description ?? ""}`.toLowerCase().includes(needle),
            )
          },
          actions: [
            {
              bind: "ctrl+l",
              title: "Index",
              side: "right",
              selection: "none",
              onTrigger: () => void submit(renderIndex()),
            },
          ],
        })
        if (!choice) return
        const result = await openHub(choice)
        if (result !== "back") return
      }
    }

    ctx.ui.slot({
      append: "sidebar.content",
      render: (input: any) => {
        createEffect(() => setLoaded(extractLoadedSkills(ctx.data.session.message.list(input.sessionID))))

        const menus = createMemo(() =>
          hubNames().map((name) => {
            const definition = hub(name)
            return { name, subs: definition?.subcommands.map((sub) => sub.label) ?? [] }
          }),
        )

        return (
          <Show when={!prefs.collapsed}>
            <box flexDirection="column" gap={0}>
              <text fg={themeColor(ctx.theme.current?.text, "#ffffff")}>{`Hubs · ${menus().length} menus · /hubs`}</text>
              <For each={menus()}>
                {(menu: { name: string; subs: string[] }) => {
                  // Read the signal inside reactive positions (JSX expressions /
                  // Show accessor) so a left click on the row actually expands
                  // the inline subcommand list. A plain `const isExpanded = ...`
                  // snapshot is evaluated once and never updates.
                  const isExpanded = () => expanded().has(menu.name)
                  return (
                    <box flexDirection="column">
                      <text
                        fg={themeColor(ctx.theme.current?.primary, "#ffffff")}
                        onMouseUp={(event: any) => {
                          if (event?.button === 2) void openHub(menu.name)
                          else toggleMenu(menu.name)
                        }}
                      >
                        {`${isExpanded() ? "▾" : "▸"} /${menu.name} (${menu.subs.length})`}
                      </text>
                      <Show when={isExpanded()}>
                        <For each={menu.subs}>
                          {(sub: string) => <text fg={themeColor(ctx.theme.current?.textMuted, "#888888")}>{`    ${sub}`}</text>}
                        </For>
                      </Show>
                    </box>
                 )}}
              </For>
            </box>
          </Show>
        )
      },
    })
  },
})
