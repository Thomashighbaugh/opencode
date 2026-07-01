import { HubSubcommandSpec } from "../../hub-data"

const spec: HubSubcommandSpec = {
  label: "icon",
  description: "Generate web/PWA/UE icon assets from source image",
  reminder: "Generate icon assets from source image.",
  skill: "icon-generator",

  detailedDescription: `Generates web UI/UX icon assets from a single source SVG or PNG. Produces:

- favicon.ico (multiple sizes embedded).
- apple-touch-icon.png (180×180).
- PWA icons (192×192, 512×512, plus maskable variants).
- Optionally Unreal Engine packaging icons.

The generator takes one source image and produces all required sizes/formats. Use when setting up a new web app or refreshing icons.`,

  tools: ["loadSkill", "bash"],
  relatedSkills: [],
}

export default spec