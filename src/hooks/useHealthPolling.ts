import { useState, useEffect, useCallback, useRef } from "react";
import { isTauri, checkAgentHealth, listRunningProcesses, updateTrayMenu } from "./useTauriCommands";

// Agent configs matching FrameworkStep.tsx
const AGENT_CONFIGS = [
  { name: "OpenClaw", slug: "openclaw", language: "Node.js", color: "hsl(265, 70%, 60%)", defaultPort: 3000, gatewayCmd: "openclaw", gatewayArgs: ["gateway"] },
  { name: "ZeroClaw", slug: "zeroclaw", language: "Rust", color: "hsl(20, 85%, 55%)", defaultPort: undefined, gatewayCmd: "zeroclaw", gatewayArgs: ["start"] },
  { name: "Nanobot", slug: "nanobot", language: "Python", color: "hsl(190, 85%, 55%)", defaultPort: 8000, gatewayCmd: "nanobot", gatewayArgs: ["gateway"] },
] as const;

export type AgentStatusValue = "running" | "stopped" | "error" | "checking" | "unknown";

export interface AgentStatus {
  name: string;
  slug: string;
  language: string;
  color: string;
  status: AgentStatusValue;
  port?: number;
  pid?: number;
  responseTimeMs?: number;
  checkedAt?: string;
  error?: string;
  gatewayCmd: string;
  gatewayArgs: string[];
}

const DEFAULT_AGENTS: AgentStatus[] = AGENT_CONFIGS.map((c) => ({
  name: c.name,
  slug: c.slug,
  language: c.language,
  color: c.color,
  status: "unknown" as AgentStatusValue,
  gatewayCmd: c.gatewayCmd,
  gatewayArgs: [...c.gatewayArgs],
}));

/**
 * Polls agent health every `intervalMs` (default 5s).
 * Returns live status for OpenClaw, ZeroClaw, Nanobot.
 * In browser mode, returns all agents as "unknown" with no polling.
 */
export function useHealthPolling(enabled: boolean = true, intervalMs: number = 5000) {
  const [agents, setAgents] = useState<AgentStatus[]>(DEFAULT_AGENTS);
  const isDesktop = isTauri();
  const mountedRef = useRef(true);

  const pollAll = useCallback(async () => {
    if (!isDesktop) return;

    const results = await Promise.all(
      AGENT_CONFIGS.map(async (cfg) => {
        try {
          const health = await checkAgentHealth(cfg.slug, cfg.defaultPort ?? null);
          if (!health) {
            return { ...cfg, status: "unknown" as AgentStatusValue, gatewayArgs: [...cfg.gatewayArgs] };
          }

          let status: AgentStatusValue;
          switch (health.status) {
            case "healthy":
            case "running":
              status = "running";
              break;
            case "unhealthy":
              status = "error";
              break;
            default:
              status = "stopped";
          }

          return {
            name: cfg.name,
            slug: cfg.slug,
            language: cfg.language,
            color: cfg.color,
            status,
            port: health.port,
            pid: health.pid,
            responseTimeMs: health.response_time_ms,
            checkedAt: health.checked_at,
            error: health.error,
            gatewayCmd: cfg.gatewayCmd,
            gatewayArgs: [...cfg.gatewayArgs],
          } as AgentStatus;
        } catch {
          return {
            name: cfg.name,
            slug: cfg.slug,
            language: cfg.language,
            color: cfg.color,
            status: "error" as AgentStatusValue,
            error: "Health check failed",
            gatewayCmd: cfg.gatewayCmd,
            gatewayArgs: [...cfg.gatewayArgs],
          } as AgentStatus;
        }
      })
    );

    if (mountedRef.current) {
      setAgents(results);
      // Update system tray with current status
      updateTrayMenu(
        results.map((a) => ({ name: a.name, status: a.status, pid: a.pid ?? null }))
      ).catch(() => {});
    }
  }, [isDesktop]);

  useEffect(() => {
    mountedRef.current = true;
    if (!enabled || !isDesktop) return;

    // Initial poll immediately
    pollAll();

    const id = setInterval(pollAll, intervalMs);
    return () => {
      mountedRef.current = false;
      clearInterval(id);
    };
  }, [enabled, isDesktop, intervalMs, pollAll]);

  const anyRunning = agents.some((a) => a.status === "running");
  const hasError = agents.some((a) => a.status === "error");
  const runningCount = agents.filter((a) => a.status === "running").length;

  return { agents, anyRunning, hasError, runningCount, refresh: pollAll };
}

/**
 * Lightweight hook for sidebar status dot.
 * Polls process list every 10s instead of full health checks.
 */
export function useSidebarHealthDot(): "green" | "gray" | "red" {
  const [dotColor, setDotColor] = useState<"green" | "gray" | "red">("gray");
  const isDesktop = isTauri();

  useEffect(() => {
    if (!isDesktop) return;

    const check = async () => {
      try {
        const procs = await listRunningProcesses(["openclaw", "zeroclaw", "nanobot"]);
        setDotColor(procs.length > 0 ? "green" : "gray");
      } catch {
        setDotColor("red");
      }
    };

    check();
    const id = setInterval(check, 10000);
    return () => clearInterval(id);
  }, [isDesktop]);

  return dotColor;
}
