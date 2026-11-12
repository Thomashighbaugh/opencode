export type Config = {
  precisePrompts: boolean
  antiDuplication: boolean
  singleConcern: boolean
  quickRouting: boolean
  preComputation: boolean
  cutExploreAgent: boolean
  nudgeDelivery: "inject"
  preferFewerLargerRequests: boolean
  mechanicalAlternatives: boolean
  promoteToProjectTooling: boolean
  preferTypeScriptOverPython: boolean
}

export function config(env = process.env): Config {
  const flag = (key: string, fallback: boolean) => {
    const raw = env[key]
    if (!raw) return fallback
    return raw.toLowerCase() !== "false"
  }
  return {
    precisePrompts: flag("RIO_PRECISE_PROMPTS", true),
    antiDuplication: flag("RIO_ANTI_DUPLICATION", true),
    singleConcern: flag("RIO_SINGLE_CONCERN", true),
    quickRouting: flag("RIO_QUICK_ROUTING", true),
    preComputation: flag("RIO_PRE_COMPUTATION", true),
    cutExploreAgent: flag("RIO_CUT_EXPLORE_AGENT", true),
    nudgeDelivery: "inject",
    preferFewerLargerRequests: flag("RIO_PREFER_FEWER_LARGER_REQUESTS", true),
    mechanicalAlternatives: flag("RIO_MECHANICAL_ALTERNATIVES", true),
    promoteToProjectTooling: flag("RIO_PROMOTE_TO_PROJECT_TOOLING", true),
    preferTypeScriptOverPython: flag("RIO_PREFER_TYPESCRIPT_OVER_PYTHON", true),
  }
}
