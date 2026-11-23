export type DesignConfig = {
  tasteGate: boolean
  impeccable: boolean
  agentDelegation: boolean
  skillDelegation: boolean
}

export function config(env = process.env): DesignConfig {
  const flag = (key: string, fallback: boolean) => {
    const raw = env[key]
    if (!raw) return fallback
    return raw.toLowerCase() !== "false"
  }
  return {
    tasteGate: flag("DESIGN_TASTE_GATE", true),
    impeccable: flag("DESIGN_IMPECCABLE", true),
    agentDelegation: flag("DESIGN_AGENT_DELEGATION", true),
    skillDelegation: flag("DESIGN_SKILL_DELEGATION", true),
  }
}
