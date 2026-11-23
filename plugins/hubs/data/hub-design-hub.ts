import { HubDefinition } from "./hub-data"
import { subcommands } from "./hubs/design-hub"

const hub: HubDefinition = {
  name: "design-hub",
  description: "UI/UX design — visual interface work only",
  stateDir: "",
  subcommands
}

export default hub
