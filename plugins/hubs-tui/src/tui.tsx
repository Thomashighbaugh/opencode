/** @jsxImportSource @opentui/solid */
import type { TuiPlugin, TuiPluginApi, TuiPluginMeta, TuiDialogSelectOption } from '@opencode-ai/plugin/tui'
import { HUBS } from './generated-hubs'
import type { Hub } from './generated-hubs'

const tui: TuiPlugin = async (api: TuiPluginApi, _o: any, _m: TuiPluginMeta) => {
  api.command!.register(() =>
    HUBS.map(h => {
      const opts: TuiDialogSelectOption<string>[] = h.subs.map(s => ({ title: s.label, value: s.label, description: s.description }))
      return {
        title: h.title, value: h.name, description: h.description, category: "Hubs Hubs",
        slash: { name: h.name },
        onSelect: () => {
          const DS = api.ui.DialogSelect
          api.ui.dialog.setSize("large")
          api.ui.dialog.replace(() => DS({
            title: `${h.title} — Select Subcommand`, placeholder: "Choose...", options: opts,
            onSelect: (sel: TuiDialogSelectOption<string>) => {
              api.ui.dialog.clear()
              const s = h.subs.find(x => x.label === sel.value)
              if (!s) return
              const cmd = `/${h.name} ${s.label}`
              api.ui.toast({ title: cmd, message: cmd })
              api.client.tui.appendPrompt({ text: cmd + " " }).catch(() => {})
            }
          }))
        }
      }
    })
  )
}

const plugin = { id: "hubs-tui-hubs", tui }
export default plugin