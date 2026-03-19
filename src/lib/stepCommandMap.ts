export interface CommandDef {
  argv_json: string[];
  risk_tier: string;
  requires_approval: boolean;
}

/** Generate a credential command def dynamically from an env var name */
export function getCredentialCommandDef(envVarName: string): CommandDef[] {
  return [
    { argv_json: ["openclaw", "config", "set", envVarName], risk_tier: "medium", requires_approval: true },
  ];
}

/** Generate a step code from a provider slug */
export function getCredentialStepCode(providerSlug: string): string {
  return `get_${providerSlug}_key`;
}

export const stepCommandMap: Record<string, CommandDef[]> = {
  check_node: [
    { argv_json: ["node", "--version"], risk_tier: "low", requires_approval: false },
    { argv_json: ["npm", "--version"], risk_tier: "low", requires_approval: false },
  ],
  install_wsl: [
    { argv_json: ["wsl", "--install"], risk_tier: "high", requires_approval: true },
  ],
  install_openclaw: [
    { argv_json: ["bash", "-c", "curl -fsSL https://openclaw.ai/install.sh | bash"], risk_tier: "medium", requires_approval: true },
    { argv_json: ["openclaw", "--version"], risk_tier: "low", requires_approval: false },
  ],
  run_onboard: [
    { argv_json: ["openclaw", "onboard"], risk_tier: "low", requires_approval: false },
  ],
  get_anthropic_key: [
    { argv_json: ["openclaw", "config", "set", "ANTHROPIC_API_KEY"], risk_tier: "medium", requires_approval: true },
  ],
  get_openai_key: [
    { argv_json: ["openclaw", "config", "set", "OPENAI_API_KEY"], risk_tier: "medium", requires_approval: true },
  ],
  get_openrouter_key: [
    { argv_json: ["openclaw", "config", "set", "OPENROUTER_API_KEY"], risk_tier: "medium", requires_approval: true },
  ],
  get_brave_key: [
    { argv_json: ["openclaw", "config", "set", "BRAVE_API_KEY"], risk_tier: "medium", requires_approval: true },
  ],
  configure_gateway: [
    { argv_json: ["openclaw", "gateway", "init"], risk_tier: "medium", requires_approval: true },
  ],
  start_gateway: [
    { argv_json: ["openclaw", "gateway", "start"], risk_tier: "medium", requires_approval: true },
    { argv_json: ["openclaw", "gateway", "status"], risk_tier: "low", requires_approval: false },
  ],
  open_dashboard: [
    { argv_json: ["openclaw", "dashboard", "open"], risk_tier: "low", requires_approval: false },
  ],
  verify_gateway: [
    { argv_json: ["openclaw", "gateway", "health"], risk_tier: "low", requires_approval: false },
  ],
  first_chat: [
    { argv_json: ["openclaw", "chat", "--test"], risk_tier: "low", requires_approval: false },
  ],
  setup_telegram: [
    { argv_json: ["openclaw", "channel", "add", "telegram"], risk_tier: "medium", requires_approval: true },
  ],
  security_audit: [
    { argv_json: ["openclaw", "audit", "run"], risk_tier: "low", requires_approval: false },
  ],
};
