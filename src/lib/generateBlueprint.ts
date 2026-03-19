export interface BlueprintIntake {
  description: string;
  useCase: string;
  channels: string[];
  providers: string[];
  deploymentModel: "local" | "cloud" | "hybrid";
  skillLevel: "beginner" | "comfortable" | "advanced";
  capabilities: string[];
  budget: string;
  usage: "personal" | "business";
}

export interface Blueprint {
  architecture: { title: string; description: string; type: string };
  installOrder: { step: number; title: string; description: string; estimated: string }[];
  credentials: { name: string; envVar: string; provider: string; monthlyCost: string; required: boolean }[];
  channelOrder: { order: number; channel: string; reason: string }[];
  security: string[];
  expansion: string[];
}

const PROVIDER_COSTS: Record<string, string> = {
  anthropic: "$5–20/mo",
  openai: "$5–30/mo",
  openrouter: "$2–15/mo",
  ollama: "Free (local compute)",
};

const PROVIDER_CREDENTIALS: Record<string, { name: string; envVar: string }> = {
  anthropic: { name: "Anthropic API Key", envVar: "ANTHROPIC_API_KEY" },
  openai: { name: "OpenAI API Key", envVar: "OPENAI_API_KEY" },
  openrouter: { name: "OpenRouter API Key", envVar: "OPENROUTER_API_KEY" },
  ollama: { name: "Ollama (local)", envVar: "OLLAMA_BASE_URL" },
};

const CHANNEL_CREDENTIALS: Record<string, { name: string; envVar: string }[]> = {
  telegram: [{ name: "Telegram Bot Token", envVar: "TELEGRAM_BOT_TOKEN" }],
  discord: [{ name: "Discord Bot Token", envVar: "DISCORD_BOT_TOKEN" }, { name: "Discord App ID", envVar: "DISCORD_APP_ID" }],
  whatsapp: [{ name: "WhatsApp Business Token", envVar: "WHATSAPP_TOKEN" }],
  slack: [{ name: "Slack Bot Token", envVar: "SLACK_BOT_TOKEN" }, { name: "Slack App Token", envVar: "SLACK_APP_TOKEN" }],
};

export function generateBlueprint(intake: BlueprintIntake): Blueprint {
  const { deploymentModel, skillLevel, providers, channels, capabilities, budget, usage } = intake;

  // Architecture
  const archMap = {
    local: { title: "Local-First Architecture", description: "Run everything on your machine. Maximum privacy, zero API costs for LLM if using Ollama. Requires decent hardware.", type: "local" },
    cloud: { title: "Cloud-Native Architecture", description: "Hosted services handle everything. Fastest setup, easiest to maintain. Monthly API costs apply.", type: "cloud" },
    hybrid: { title: "Hybrid Architecture", description: "Local inference for development, cloud APIs for production. Best balance of cost and capability.", type: "hybrid" },
  };
  const architecture = archMap[deploymentModel];

  // Install order
  const installOrder: Blueprint["installOrder"] = [];
  let step = 1;
  installOrder.push({ step: step++, title: "Install Node.js & pnpm", description: "Set up the JavaScript runtime and package manager.", estimated: "5 min" });
  
  if (deploymentModel !== "cloud") {
    installOrder.push({ step: step++, title: "Install Ollama (optional)", description: "Local LLM runtime for offline inference.", estimated: "10 min" });
  }

  installOrder.push({ step: step++, title: "Clone & Install OpenClaw", description: "Clone the repository and install dependencies.", estimated: "5 min" });
  installOrder.push({ step: step++, title: "Configure Environment Variables", description: "Set up your .env file with API keys and settings.", estimated: "10 min" });

  for (const p of providers) {
    if (p !== "ollama") {
      installOrder.push({ step: step++, title: `Set Up ${p.charAt(0).toUpperCase() + p.slice(1)} Provider`, description: `Register and configure your ${p} API access.`, estimated: "5 min" });
    }
  }

  for (const ch of channels) {
    if (ch !== "dashboard") {
      installOrder.push({ step: step++, title: `Deploy ${ch.charAt(0).toUpperCase() + ch.slice(1)} Channel`, description: `Connect OpenClaw to ${ch}.`, estimated: "15 min" });
    }
  }

  for (const cap of capabilities) {
    installOrder.push({ step: step++, title: `Enable ${cap.replace(/_/g, " ")}`, description: `Configure the ${cap.replace(/_/g, " ")} capability.`, estimated: "10 min" });
  }

  installOrder.push({ step: step++, title: "Run Validation Checks", description: "Verify all connections and credentials are working.", estimated: "5 min" });
  installOrder.push({ step: step++, title: "Launch & Test", description: "Start OpenClaw and run through test scenarios.", estimated: "10 min" });

  // Credentials
  const credentials: Blueprint["credentials"] = [];
  for (const p of providers) {
    const cred = PROVIDER_CREDENTIALS[p];
    if (cred) {
      credentials.push({ ...cred, provider: p, monthlyCost: PROVIDER_COSTS[p] ?? "Varies", required: true });
    }
  }
  for (const ch of channels) {
    const creds = CHANNEL_CREDENTIALS[ch];
    if (creds) {
      for (const c of creds) {
        credentials.push({ ...c, provider: ch, monthlyCost: "Free", required: true });
      }
    }
  }

  // Channel order
  const channelPriority = ["dashboard", "telegram", "discord", "slack", "whatsapp"];
  const channelOrder = channels
    .sort((a, b) => channelPriority.indexOf(a) - channelPriority.indexOf(b))
    .map((ch, i) => ({
      order: i + 1,
      channel: ch.charAt(0).toUpperCase() + ch.slice(1),
      reason: i === 0 ? "Start here — easiest to test and debug." : `Add after confirming ${channels[i - 1]} works.`,
    }));

  // Security
  const security: string[] = [
    "Store all API keys in environment variables, never in code.",
    "Use .env files excluded from version control via .gitignore.",
  ];
  if (usage === "business") {
    security.push("Enable rate limiting on all external-facing channels.");
    security.push("Set up monitoring and logging for all API calls.");
    security.push("Consider IP whitelisting for webhook endpoints.");
  }
  if (channels.includes("whatsapp") || channels.includes("slack")) {
    security.push("Validate webhook signatures on incoming messages.");
  }
  if (deploymentModel === "local" || deploymentModel === "hybrid") {
    security.push("Keep Ollama behind a firewall — do not expose to the internet.");
  }

  // Expansion
  const expansion: string[] = [];
  if (!capabilities.includes("web_search")) expansion.push("Add web search capability for real-time information access.");
  if (!capabilities.includes("image_gen")) expansion.push("Add image generation for visual content creation.");
  if (!capabilities.includes("code_execution")) expansion.push("Enable code execution for running scripts and analysis.");
  if (providers.length < 2) expansion.push("Add a backup LLM provider for redundancy.");
  if (!channels.includes("discord")) expansion.push("Deploy to Discord for community engagement.");
  if (budget === "<$10" || budget === "$10-30") expansion.push("Consider upgrading budget to unlock higher rate limits.");
  expansion.push("Set up automated backups of your configuration.");
  expansion.push("Explore OpenClaw plugins for extended functionality.");

  return { architecture, installOrder, credentials, channelOrder, security, expansion };
}
