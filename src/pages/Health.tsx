import { useState, useEffect, useRef } from "react";
import { Activity, Play, Square, RefreshCw, Loader2, ChevronDown, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { isTauri, runCommandDetached, killProcess } from "@/hooks/useTauriCommands";
import { useHealthPolling, type AgentStatus, type AgentStatusValue } from "@/hooks/useHealthPolling";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<AgentStatusValue, { label: string; dotClass: string; badgeClass: string }> = {
  running: {
    label: "Running",
    dotClass: "bg-emerald-400 animate-pulse",
    badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
  stopped: {
    label: "Stopped",
    dotClass: "bg-muted-foreground/40",
    badgeClass: "bg-muted text-muted-foreground border-border",
  },
  error: {
    label: "Error",
    dotClass: "bg-red-400 animate-pulse",
    badgeClass: "bg-red-500/15 text-red-400 border-red-500/30",
  },
  checking: {
    label: "Checking",
    dotClass: "bg-blue-400 animate-pulse",
    badgeClass: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
  unknown: {
    label: "Unknown",
    dotClass: "bg-muted-foreground/20",
    badgeClass: "bg-muted text-muted-foreground/60 border-border",
  },
};

// ---------------------------------------------------------------------------
// Agent Card
// ---------------------------------------------------------------------------

function AgentCard({ agent, onRefresh }: { agent: AgentStatus; onRefresh: () => void }) {
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [managedPid, setManagedPid] = useState<number | null>(null);

  const config = STATUS_CONFIG[agent.status];

  const handleStart = async () => {
    setStarting(true);
    try {
      const pid = await runCommandDetached(agent.gatewayCmd, agent.gatewayArgs);
      setManagedPid(pid);
      toast.success(`${agent.name} started (PID: ${pid})`);
      // Wait a moment then refresh status
      setTimeout(onRefresh, 1500);
    } catch (err: any) {
      toast.error(`Failed to start ${agent.name}: ${err.message}`);
    } finally {
      setStarting(false);
    }
  };

  const handleStop = async () => {
    const pid = agent.pid ?? managedPid;
    if (!pid) {
      toast.error("No PID available to stop");
      return;
    }
    setStopping(true);
    try {
      await killProcess(pid);
      setManagedPid(null);
      toast.success(`${agent.name} stopped`);
      setTimeout(onRefresh, 1000);
    } catch (err: any) {
      toast.error(`Failed to stop ${agent.name}: ${err.message}`);
    } finally {
      setStopping(false);
    }
  };

  const handleRestart = async () => {
    const pid = agent.pid ?? managedPid;
    if (pid) {
      setStopping(true);
      try {
        await killProcess(pid);
      } catch { /* ignore */ }
      setStopping(false);
    }
    await handleStart();
  };

  const isRunning = agent.status === "running";
  const isBusy = starting || stopping;

  return (
    <div
      className={cn(
        "rounded-xl border p-5 space-y-4 transition-all",
        isRunning
          ? "border-emerald-500/30 bg-emerald-500/5"
          : agent.status === "error"
            ? "border-red-500/20 bg-red-500/5"
            : "border-border bg-card",
      )}
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Colored initial circle */}
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white font-bold text-lg"
            style={{ backgroundColor: agent.color }}
          >
            {agent.name[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading text-base font-semibold text-foreground">{agent.name}</span>
              <span className="text-xs text-muted-foreground">{agent.language}</span>
            </div>
            {/* Metadata when running */}
            {isRunning && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                {agent.port && <span>Port {agent.port}</span>}
                {agent.pid && <span>PID {agent.pid}</span>}
                {agent.responseTimeMs != null && <span>{agent.responseTimeMs}ms</span>}
              </div>
            )}
          </div>
        </div>

        {/* Status badge */}
        <Badge variant="outline" className={cn("text-xs gap-1.5", config.badgeClass)}>
          <span className={cn("h-2 w-2 rounded-full", config.dotClass)} />
          {config.label}
        </Badge>
      </div>

      {/* Error message */}
      {agent.error && agent.status === "error" && (
        <p className="text-xs text-red-400 bg-red-500/5 rounded-lg px-3 py-2">{agent.error}</p>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {!isRunning ? (
          <Button
            size="sm"
            className="h-8 text-xs gap-1.5"
            disabled={isBusy}
            onClick={handleStart}
          >
            {starting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            Start
          </Button>
        ) : (
          <>
            <Button
              size="sm"
              variant="destructive"
              className="h-8 text-xs gap-1.5"
              disabled={isBusy}
              onClick={handleStop}
            >
              {stopping ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Square className="h-3.5 w-3.5" />}
              Stop
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1.5"
              disabled={isBusy}
              onClick={handleRestart}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Restart
            </Button>
          </>
        )}

        {/* Log toggle */}
        <Button
          size="sm"
          variant="ghost"
          className="h-8 text-xs gap-1 text-muted-foreground ml-auto"
          onClick={() => setLogOpen(!logOpen)}
        >
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", logOpen && "rotate-180")} />
          Log
        </Button>
      </div>

      {/* Collapsible log panel */}
      {logOpen && (
        <div className="rounded-lg overflow-hidden border border-border/50">
          <pre
            className="px-3 py-2 max-h-[150px] overflow-y-auto text-xs whitespace-pre-wrap"
            style={{
              backgroundColor: "#0A0A1A",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontSize: "12px",
              lineHeight: "1.6",
              color: "#6B7280",
            }}
          >
            {isRunning
              ? `[${agent.checkedAt ?? "now"}] Agent running on port ${agent.port ?? "unknown"}\n[health] Status: ${agent.status} · Response: ${agent.responseTimeMs ?? "?"}ms`
              : "Start the agent to see gateway logs.\nStreaming logs will be available in a future update."}
          </pre>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function Health() {
  const isDesktop = isTauri();
  const { agents, anyRunning, runningCount, refresh } = useHealthPolling(true);

  // Browser fallback
  if (!isDesktop) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-6">
          <Monitor className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="font-heading text-2xl font-bold text-foreground">Desktop App Required</h2>
        <p className="mt-3 max-w-md text-muted-foreground">
          Connect the Adl._.Ai Studio desktop app for live agent monitoring, start/stop controls, and gateway logs.
        </p>
      </div>
    );
  }

  const summaryText =
    runningCount === 0
      ? "All agents stopped"
      : runningCount === 1
        ? "1 agent running"
        : `${runningCount} agents running`;

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-8 px-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            <h1 className="font-heading text-2xl font-bold text-foreground">Health Monitor</h1>
          </div>
          <p className="mt-2 text-muted-foreground">
            Agent status and control —{" "}
            <span className={cn("font-medium", anyRunning ? "text-emerald-400" : "text-muted-foreground")}>
              {summaryText}
            </span>
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 text-xs gap-1.5"
          onClick={refresh}
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {/* Agent cards */}
      <div className="space-y-4">
        {agents.map((agent) => (
          <AgentCard key={agent.slug} agent={agent} onRefresh={refresh} />
        ))}
      </div>

      {/* Info footer */}
      <p className="text-xs text-muted-foreground text-center">
        Health checks run every 5 seconds. Agents are checked via HTTP endpoint or process detection.
      </p>
    </div>
  );
}
