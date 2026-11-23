import { HubSubcommand } from "../../hub-data"
import redesign from "./redesign"
import designer from "./designer"
import frontendDesign from "./frontend-design"
import icon from "./icon"
import taste from "./taste"
import designMd from "./design-md"
import impeccableShape from "./impeccable-shape"
import impeccableInit from "./impeccable-init"
import impeccableDocument from "./impeccable-document"
import impeccableExtract from "./impeccable-extract"
import impeccableCritique from "./impeccable-critique"
import impeccableAudit from "./impeccable-audit"
import impeccablePolish from "./impeccable-polish"
import impeccableBolder from "./impeccable-bolder"
import impeccableQuieter from "./impeccable-quieter"
import impeccableDistill from "./impeccable-distill"
import impeccableHarden from "./impeccable-harden"
import impeccableOnboard from "./impeccable-onboard"
import impeccableAnimate from "./impeccable-animate"
import impeccableColorize from "./impeccable-colorize"
import impeccableTypeset from "./impeccable-typeset"
import impeccableLayout from "./impeccable-layout"
import impeccableDelight from "./impeccable-delight"
import impeccableOverdrive from "./impeccable-overdrive"
import impeccableClarify from "./impeccable-clarify"
import impeccableAdapt from "./impeccable-adapt"
import impeccableOptimize from "./impeccable-optimize"
import impeccableLive from "./impeccable-live"
import impeccableGenerate from "./impeccable-generate"
import impeccableCraft from "./impeccable-craft"

export const specs = [
  redesign, designer, frontendDesign, icon, taste, designMd,
  impeccableShape, impeccableInit, impeccableDocument, impeccableExtract,
  impeccableCritique, impeccableAudit, impeccablePolish, impeccableBolder,
  impeccableQuieter, impeccableDistill, impeccableHarden, impeccableOnboard,
  impeccableAnimate, impeccableColorize, impeccableTypeset, impeccableLayout,
  impeccableDelight, impeccableOverdrive, impeccableClarify, impeccableAdapt,
  impeccableOptimize, impeccableLive, impeccableGenerate, impeccableCraft
]

export const subcommands: HubSubcommand[] = specs.map(s => ({
  label: s.label, description: s.description, reminder: s.reminder,
  skill: s.skill, agent: s.agent, command: s.command, inline: s.inline, phases: s.phases
}))
