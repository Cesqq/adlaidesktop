export interface StepContent {
  whyItMatters: string;
  instructions: string[];
  commands?: { label: string; cmd: string }[];
  tabs?: { name: string; commands: { label: string; cmd: string }[] }[];
  verification?: { command: string; expectedOutput: string };
  commonIssues: string[];
}

export const STEP_CONTENT: Record<string, StepContent> = {
  check_node: {
    whyItMatters:
      "OpenClaw requires Node.js 22+ to run its gateway and CLI tools. Checking your version first prevents cryptic errors later.",
    instructions: [
      "Open your terminal (or PowerShell on Windows).",
      "Run the version check command below.",
      "You need v22 or higher. If it's lower or missing, OpenClaw's installer will handle it automatically.",
    ],
    commands: [{ label: "Check Node version", cmd: "node -v" }],
    verification: {
      command: "node -v",
      expectedOutput: "v22.x.x or higher (e.g. v22.11.0)",
    },
    commonIssues: [
      "If you see 'command not found', Node.js is not installed — the OpenClaw installer will handle it.",
      "If your version is below 22, use nvm to install a newer version: nvm install 22",
      "On Windows, make sure you're using the correct terminal (PowerShell or CMD, not Git Bash).",
    ],
  },
  install_wsl: {
    whyItMatters:
      "WSL2 gives you a full Linux environment on Windows, which OpenClaw needs for its daemon process and Unix-style tooling.",
    instructions: [
      "Open PowerShell as Administrator.",
      "Run the install command below.",
      "After installation completes, restart your computer.",
      "Verify WSL2 is active with the list command.",
      "Make sure your distro shows Version 2 in the output.",
    ],
    commands: [
      { label: "Install WSL", cmd: "wsl --install" },
      { label: "Verify WSL version", cmd: "wsl --list --verbose" },
    ],
    verification: {
      command: "wsl --list --verbose",
      expectedOutput: "Your distro listed with VERSION = 2",
    },
    commonIssues: [
      "If install fails, enable 'Virtual Machine Platform' in Windows Features.",
      "If distro shows Version 1, convert it: wsl --set-version Ubuntu 2",
      "Hyper-V must be enabled in BIOS for WSL2 to work.",
    ],
  },
  install_openclaw: {
    whyItMatters:
      "This installs the OpenClaw CLI and gateway — the core software that powers your AI setup.",
    instructions: [
      "Choose your preferred installation method below.",
      "The Fast Path runs the installer directly. The Inspect-First path lets you review the script before executing.",
      "On Windows, use the PowerShell variant.",
    ],
    tabs: [
      {
        name: "Fast Path",
        commands: [
          {
            label: "Run installer",
            cmd: "curl -fsSL https://openclaw.ai/install.sh | bash",
          },
        ],
      },
      {
        name: "Inspect-First",
        commands: [
          {
            label: "Download, review, then run",
            cmd: "curl -fsSL https://openclaw.ai/install.sh -o install.sh && cat install.sh && bash install.sh",
          },
        ],
      },
      {
        name: "Windows PowerShell",
        commands: [
          {
            label: "PowerShell installer",
            cmd: "iwr -useb https://openclaw.ai/install.ps1 | iex",
          },
        ],
      },
    ],
    verification: {
      command: "openclaw --version",
      expectedOutput: "OpenClaw vX.X.X with version banner",
    },
    commonIssues: [
      "If curl is not found on Windows, use the PowerShell variant instead.",
      "Permission denied? Try with sudo on Linux/macOS.",
      "If the install script hangs, check your internet connection and firewall settings.",
    ],
  },
  run_onboard: {
    whyItMatters:
      "The onboarding wizard configures your gateway, sets up authentication, and creates your initial config — all interactively.",
    instructions: [
      "Run the onboard command below.",
      "Follow the interactive prompts to configure your gateway mode, provider, and channels.",
      "The --install-daemon flag sets up the background service automatically.",
    ],
    commands: [
      {
        label: "Run onboarding",
        cmd: "openclaw onboard --install-daemon",
      },
    ],
    verification: {
      command: "openclaw status",
      expectedOutput: "Gateway: configured, showing your chosen mode and provider",
    },
    commonIssues: [
      "If the command is not found, make sure OpenClaw is in your PATH.",
      "On Windows via WSL, run this inside the WSL terminal, not PowerShell.",
      "If onboarding exits unexpectedly, check logs with: openclaw logs --last 50",
    ],
  },
  get_anthropic_key: {
    whyItMatters:
      "Your Anthropic API key lets OpenClaw connect to Claude models. Without it, AI responses won't work if Anthropic is your provider.",
    instructions: [
      "Go to console.anthropic.com and sign in (or create an account).",
      "Navigate to API Keys and generate a new key.",
      "Copy the key and set it as an environment variable using the command below.",
      "Add it to your shell profile (.bashrc, .zshrc) to persist across sessions.",
    ],
    commands: [
      {
        label: "Set API key",
        cmd: "export ANTHROPIC_API_KEY=sk-ant-your-key-here",
      },
    ],
    verification: {
      command: "echo $ANTHROPIC_API_KEY",
      expectedOutput: "Your API key string (starts with sk-ant-)",
    },
    commonIssues: [
      "Key not persisting? Add the export line to your ~/.bashrc or ~/.zshrc file.",
      "Getting 401 errors? Your account may need billing set up at console.anthropic.com.",
      "Don't share your API key or commit it to version control.",
    ],
  },
  get_openai_key: {
    whyItMatters:
      "An OpenAI API key connects OpenClaw to GPT models. Required if OpenAI is your chosen provider.",
    instructions: [
      "Go to platform.openai.com and sign in.",
      "Navigate to API Keys and create a new secret key.",
      "Copy the key and set it as an environment variable.",
    ],
    commands: [
      {
        label: "Set API key",
        cmd: "export OPENAI_API_KEY=sk-your-key-here",
      },
    ],
    verification: {
      command: "echo $OPENAI_API_KEY",
      expectedOutput: "Your API key string (starts with sk-)",
    },
    commonIssues: [
      "Free-tier keys have low rate limits — consider adding billing.",
      "Key not found? Make sure you're in the right shell session.",
      "If you're using a project key, ensure the project has API access enabled.",
    ],
  },
  get_openrouter_key: {
    whyItMatters:
      "OpenRouter gives you access to multiple AI models through a single API, offering flexibility and fallback options.",
    instructions: [
      "Go to openrouter.ai and create an account.",
      "Navigate to Keys and generate an API key.",
      "Set it as an environment variable.",
    ],
    commands: [
      {
        label: "Set API key",
        cmd: "export OPENROUTER_API_KEY=your-key-here",
      },
    ],
    verification: {
      command: "echo $OPENROUTER_API_KEY",
      expectedOutput: "Your OpenRouter API key string",
    },
    commonIssues: [
      "Some models on OpenRouter require credits — check pricing on their site.",
      "Key format differs from OpenAI — don't add sk- prefix.",
      "Rate limits vary by model; check your plan's limits.",
    ],
  },
  get_brave_key: {
    whyItMatters:
      "The Brave Search API gives OpenClaw web search capabilities, allowing your AI to retrieve real-time information.",
    instructions: [
      "Go to brave.com/search/api and sign up for a free API key.",
      "Copy your key from the dashboard.",
      "Set it as an environment variable.",
    ],
    commands: [
      {
        label: "Set API key",
        cmd: "export BRAVE_API_KEY=your-key-here",
      },
    ],
    verification: {
      command: "echo $BRAVE_API_KEY",
      expectedOutput: "Your Brave Search API key",
    },
    commonIssues: [
      "Free tier has a monthly query limit — check your usage on the Brave dashboard.",
      "If search results are empty, verify the key is active in your Brave account.",
      "This key is optional — OpenClaw works without search, just without web access.",
    ],
  },
  configure_gateway: {
    whyItMatters:
      "The gateway is the bridge between your channels and AI providers. Proper configuration ensures secure, reliable communication.",
    instructions: [
      "During onboarding, choose 'local' mode for the gateway.",
      "Set the port to 18789 (the default).",
      "Use token auth for security.",
      "Keep the gateway bound to localhost to prevent external access.",
    ],
    commands: [
      { label: "View current config", cmd: "openclaw config show" },
      { label: "Validate config", cmd: "openclaw config validate" },
    ],
    verification: {
      command: "openclaw config validate",
      expectedOutput: "Configuration valid — no errors",
    },
    commonIssues: [
      "Port 18789 in use? Change it in config or stop the conflicting service.",
      "If binding to 0.0.0.0, your gateway is exposed to your network — use localhost instead.",
      "Config changes require a gateway restart to take effect.",
    ],
  },
  start_gateway: {
    whyItMatters:
      "The gateway daemon must be running for OpenClaw to process messages. It should auto-start after onboarding.",
    instructions: [
      "The daemon should auto-start after onboarding.",
      "Use the status command to verify it's running.",
      "If not running, start it manually.",
    ],
    commands: [
      { label: "Check gateway status", cmd: "openclaw gateway status" },
      { label: "Start gateway manually", cmd: "openclaw gateway start" },
    ],
    verification: {
      command: "openclaw gateway status",
      expectedOutput: "Gateway: running, pid: XXXX, port: 18789",
    },
    commonIssues: [
      "If the gateway won't start, check if port 18789 is already in use.",
      "On WSL, make sure the daemon service is enabled: openclaw daemon enable",
      "Check logs for startup errors: openclaw logs --last 20",
    ],
  },
  open_dashboard: {
    whyItMatters:
      "The Control UI dashboard gives you a visual interface to manage your OpenClaw instance, test chat, and monitor activity.",
    instructions: [
      "Run the dashboard command to open it in your browser.",
      "If you're on a headless server, use the --no-open flag and copy the URL manually.",
    ],
    commands: [
      { label: "Open dashboard", cmd: "openclaw dashboard" },
      {
        label: "Headless mode",
        cmd: "openclaw dashboard --no-open",
      },
    ],
    verification: {
      command: "openclaw dashboard --status",
      expectedOutput: "Dashboard available at http://localhost:XXXX",
    },
    commonIssues: [
      "Browser not opening? Copy the URL from terminal output manually.",
      "If the page won't load, make sure the gateway is running first.",
      "On remote servers, use SSH port forwarding: ssh -L 3000:localhost:3000 user@server",
    ],
  },
  verify_gateway: {
    whyItMatters:
      "Verifying the gateway ensures everything is connected and responding. Catching issues now prevents debugging headaches later.",
    instructions: [
      "Run the status command to get an overview.",
      "Then run the health check for a quick liveness probe.",
      "Both should show positive results.",
    ],
    commands: [
      { label: "System status", cmd: "openclaw status" },
      { label: "Health check", cmd: "openclaw health" },
    ],
    verification: {
      command: "openclaw health",
      expectedOutput: "Exit code 0 — gateway reachable and healthy",
    },
    commonIssues: [
      "'Gateway: unreachable' — start it with: openclaw gateway start",
      "Health check fails but status looks ok? Try: openclaw doctor for deeper diagnostics.",
      "Timeout errors usually mean a firewall or port conflict.",
    ],
  },
  first_chat: {
    whyItMatters:
      "Sending your first message confirms the full pipeline works: channel → gateway → AI provider → response.",
    instructions: [
      "Open the dashboard Control UI in your browser.",
      "Type a message in the chat input and send it.",
      "If you get a response, your setup is complete!",
    ],
    commands: [
      { label: "Open dashboard", cmd: "openclaw dashboard" },
    ],
    verification: {
      command: "openclaw status --deep",
      expectedOutput: "All channels responding, AI provider connected",
    },
    commonIssues: [
      "No response? Check your API key is set correctly for your provider.",
      "Timeout? The provider may be rate-limiting you — wait and retry.",
      "If the chat UI loads but messages fail, check: openclaw logs --follow",
    ],
  },
  setup_telegram: {
    whyItMatters:
      "Connecting Telegram lets your AI respond to messages in Telegram chats. Great for mobile access and group interactions.",
    instructions: [
      "Open Telegram and message @BotFather.",
      "Send /newbot and follow the prompts to create a bot.",
      "Copy the bot token BotFather gives you.",
      "Add the token during openclaw onboard or set it in your config.",
      "DM policy defaults to pairing — the first message from a new user requires approval.",
    ],
    commands: [
      {
        label: "Set Telegram token",
        cmd: "export TELEGRAM_BOT_TOKEN=your-bot-token-here",
      },
    ],
    verification: {
      command: "openclaw channels status --probe",
      expectedOutput: "Telegram: connected, bot @YourBotName responding",
    },
    commonIssues: [
      "Bot not responding? Make sure the token is correct and the gateway is running.",
      "If you get 'Conflict: terminated by other getUpdates', only one instance can poll at a time.",
      "Webhook mode vs polling: polling is default and easier for local setups.",
    ],
  },
  security_audit: {
    whyItMatters:
      "A security audit checks for common misconfigurations that could expose your gateway, keys, or data.",
    instructions: [
      "Run the basic audit command first.",
      "For a more thorough check, use the --deep flag.",
      "To automatically fix common issues, use the --fix flag.",
    ],
    commands: [
      { label: "Basic audit", cmd: "openclaw security audit" },
      { label: "Deep audit", cmd: "openclaw security audit --deep" },
      { label: "Auto-fix issues", cmd: "openclaw security audit --fix" },
    ],
    verification: {
      command: "openclaw security audit",
      expectedOutput: "All checks passed — no security issues found",
    },
    commonIssues: [
      "Gateway bound to 0.0.0.0? Rebind to localhost unless you need network access.",
      "API keys in config files? Move them to environment variables.",
      "Token auth disabled? Re-enable it: openclaw config set auth.enabled true",
    ],
  },
};

export interface VerificationCommand {
  command: string;
  description: string;
  whatItChecks: string;
  healthy: string;
  broken: string;
}

export const VERIFICATION_COMMANDS: VerificationCommand[] = [
  {
    command: "openclaw --version",
    description: "Version banner",
    whatItChecks: "CLI is installed and in PATH",
    healthy: "OpenClaw vX.X.X — version number displayed",
    broken: "'command not found' — CLI not installed or not in PATH",
  },
  {
    command: "openclaw status",
    description: "System overview",
    whatItChecks: "Gateway reachability, configured channels, provider status",
    healthy: "Gateway: local mode, reachable. Channels and provider listed.",
    broken: "'Gateway: unreachable' or missing provider info",
  },
  {
    command: "openclaw status --deep",
    description: "Deep status with live probes",
    whatItChecks: "Live channel connectivity and provider response times",
    healthy: "All channels responding, latency numbers shown",
    broken: "Channel timeouts or provider errors listed",
  },
  {
    command: "openclaw gateway status",
    description: "Service supervisor check",
    whatItChecks: "Whether the gateway daemon process is running",
    healthy: "Gateway: running, pid: XXXX, port: 18789",
    broken: "'Gateway: stopped' or 'not found'",
  },
  {
    command: "openclaw health",
    description: "Minimal liveness probe",
    whatItChecks: "Gateway responds to a basic health ping",
    healthy: "Exit code 0 — healthy",
    broken: "Non-zero exit code or timeout",
  },
  {
    command: "openclaw doctor",
    description: "Multi-phase diagnostic",
    whatItChecks: "Config validity, connectivity, permissions, common issues",
    healthy: "All checks passed with green indicators",
    broken: "Specific failures listed with suggested fixes",
  },
  {
    command: "openclaw doctor --fix",
    description: "Auto-repair common issues",
    whatItChecks: "Same as doctor, but attempts automatic fixes",
    healthy: "Issues found and fixed automatically",
    broken: "Some issues require manual intervention (listed)",
  },
  {
    command: "openclaw channels status --probe",
    description: "Live channel checks",
    whatItChecks: "Each configured channel's connectivity in real-time",
    healthy: "All channels: connected, responding",
    broken: "Channel-specific errors (e.g., invalid token, timeout)",
  },
  {
    command: "openclaw security audit",
    description: "Security config audit",
    whatItChecks: "Auth settings, key exposure, network binding, permissions",
    healthy: "All security checks passed",
    broken: "Warnings about exposed keys, open ports, or disabled auth",
  },
  {
    command: "openclaw config validate",
    description: "Config schema check",
    whatItChecks: "Configuration file syntax and required fields",
    healthy: "Configuration valid — no errors",
    broken: "Schema errors or missing required fields listed",
  },
];

export const TRIAGE_SEQUENCE = [
  { step: 1, command: "openclaw status", purpose: "Get a system overview" },
  { step: 2, command: "openclaw gateway status", purpose: "Check if gateway process is running" },
  { step: 3, command: "openclaw status --deep", purpose: "Run deep connectivity checks" },
  { step: 4, command: "openclaw logs --follow", purpose: "Watch live error output" },
  { step: 5, command: "openclaw doctor --fix", purpose: "Auto-repair common issues" },
];
