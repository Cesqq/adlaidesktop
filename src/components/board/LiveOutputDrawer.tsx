import { useEffect, useRef, useState, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Loader2, Copy, Lock, Unlock, Terminal, ArrowDown } from "lucide-react";
import { usePlanDetail } from "@/hooks/useCommandPlan";
import { useRealtimeOutput, type OutputChunk } from "@/hooks/useRealtimeOutput";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  planId: string | null;
  open: boolean;
  onClose: () => void;
  machineLabel?: string;
  stepTitle?: string;
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  queued: { label: "Queued", className: "bg-muted text-muted-foreground" },
  running: { label: "Running", className: "bg-blue-500/20 text-blue-400" },
  succeeded: { label: "Succeeded", className: "bg-green-500/20 text-green-400" },
  failed: { label: "Failed", className: "bg-destructive/20 text-destructive" },
};

const RISK_BADGE: Record<string, { label: string; className: string }> = {
  low: { label: "Low", className: "bg-green-500/20 text-green-400" },
  medium: { label: "Medium", className: "bg-amber-500/20 text-amber-400" },
  high: { label: "High", className: "bg-destructive/20 text-destructive" },
  critical: { label: "Critical", className: "bg-purple-500/20 text-purple-400" },
};

const STATE_ICON: Record<string, React.ReactNode> = {
  queued: <span className="h-3 w-3 rounded-full bg-muted-foreground/40" />,
  running: <Loader2 className="h-3 w-3 animate-spin text-blue-400" />,
  succeeded: <Check className="h-3 w-3 text-green-400" />,
  failed: <X className="h-3 w-3 text-destructive" />,
};

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = (ms / 1000).toFixed(1);
  return `${s}s`;
}

export function LiveOutputDrawer({ planId, open, onClose, machineLabel, stepTitle }: Props) {
  const { plan, machineId, commands, outputs } = usePlanDetail(open ? planId : null);
  const { streamedOutput, isStreaming } = useRealtimeOutput(
    open ? machineId : null,
    open ? planId : null
  );
  const [scrollLocked, setScrollLocked] = useState(false);
  const [hasNewOutput, setHasNewOutput] = useState(false);
  const termRef = useRef<HTMLDivElement>(null);
  const prevOutputLenRef = useRef(0);

  // Build per-command output for rendering
  const commandOutputs = commands.map((cmd) => {
    const dbOutput = outputs.find((o) => o.command_id === cmd.id);
    const realtimeState = streamedOutput.get(cmd.id);

    // If we have realtime chunks, prefer those; otherwise fall back to DB
    let lines: { text: string; stream: "stdout" | "stderr" }[] = [];
    let outputUnavailable = false;

    if (realtimeState && realtimeState.chunks.length > 0) {
      lines = realtimeState.chunks.map((c) => ({
        text: c.text,
        stream: c.stream,
      }));
    } else if (dbOutput) {
      lines = [{ text: dbOutput.output_text, stream: "stdout" as const }];
    } else if ((cmd.state === "succeeded" || cmd.state === "failed") && !dbOutput) {
      outputUnavailable = true;
    }

    const done = realtimeState?.done ?? (cmd.state === "succeeded" || cmd.state === "failed");
    const exitCode = realtimeState?.exitCode ?? cmd.exit_code;
    const durationMs = realtimeState?.durationMs;

    return { cmd, lines, done, exitCode, durationMs, outputUnavailable };
  });

  // Compute total output length for detecting new output
  const totalOutputLen = commandOutputs.reduce(
    (acc, co) => acc + co.lines.reduce((a, l) => a + l.text.length, 0),
    0
  );

  // Auto-scroll or show "new output" badge
  useEffect(() => {
    if (totalOutputLen > prevOutputLenRef.current) {
      if (scrollLocked) {
        setHasNewOutput(true);
      } else if (termRef.current) {
        termRef.current.scrollTop = termRef.current.scrollHeight;
      }
    }
    prevOutputLenRef.current = totalOutputLen;
  }, [totalOutputLen, scrollLocked]);

  const scrollToBottom = useCallback(() => {
    if (termRef.current) {
      termRef.current.scrollTop = termRef.current.scrollHeight;
    }
    setScrollLocked(false);
    setHasNewOutput(false);
  }, []);

  const copyOutput = () => {
    const text = commandOutputs
      .map((co) => {
        const header = `$ ${(co.cmd.argv_json as string[]).join(" ")}`;
        const body = co.lines.map((l) => l.text).join("");
        return `${header}\n${body}`;
      })
      .filter((t) => t.length > 2)
      .join("\n\n");
    navigator.clipboard.writeText(text || "(no output yet)");
    toast.success("Output copied");
  };

  const statusBadge = STATUS_BADGE[plan?.status ?? "queued"] ?? STATUS_BADGE.queued;
  const isHistorical = plan?.status === "succeeded" || plan?.status === "failed";

  // For historical plans, skip realtime (machineId won't be passed)
  // Already handled by passing null machineId when plan is completed

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent className="sm:max-w-[500px] p-0 flex flex-col" side="right">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border shrink-0">
          <SheetTitle className="flex items-center gap-2 text-base flex-wrap">
            <Terminal className="h-4 w-4 text-primary" />
            {stepTitle ?? "Command Plan"}
            <Badge className={cn("text-[10px] font-medium", statusBadge.className)}>
              {statusBadge.label}
            </Badge>
            {isHistorical && (
              <Badge variant="outline" className="text-[10px] font-medium border-muted-foreground/30 text-muted-foreground">
                historical
              </Badge>
            )}
            {isStreaming && !isHistorical && (
              <span className="flex items-center gap-1 text-[10px] text-blue-400">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                Live
              </span>
            )}
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            {machineLabel ? `Running on ${machineLabel}` : "Command execution details"}
          </SheetDescription>
        </SheetHeader>

        {/* Commands list */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-5 py-4 space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Commands</h4>
            {commands.map((cmd) => {
              const risk = RISK_BADGE[cmd.risk_tier] ?? RISK_BADGE.low;
              const rt = streamedOutput.get(cmd.id);
              const effectiveState = rt?.done
                ? rt.exitCode === 0 ? "succeeded" : "failed"
                : cmd.state;
              return (
                <div
                  key={cmd.id}
                  className="rounded-lg border border-border bg-card p-3 space-y-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground font-mono">#{cmd.seq}</span>
                    {STATE_ICON[effectiveState] ?? STATE_ICON.queued}
                    <code className="text-xs font-mono text-foreground truncate flex-1">
                      {(cmd.argv_json as string[]).join(" ")}
                    </code>
                    <Badge className={cn("text-[9px] shrink-0", risk.className)}>{risk.label}</Badge>
                  </div>
                  {cmd.requires_approval && effectiveState === "queued" && (
                    <p className="text-[10px] text-amber-400 pl-7">Requires approval on companion</p>
                  )}
                  {rt?.done && rt.durationMs != null && (
                    <p className="text-[10px] text-muted-foreground pl-7">
                      Duration: {formatDuration(rt.durationMs)}
                    </p>
                  )}
                  {(rt?.exitCode ?? cmd.exit_code) !== null && (
                    <p className={cn("text-[10px] pl-7", (rt?.exitCode ?? cmd.exit_code) === 0 ? "text-green-400" : "text-destructive")}>
                      Exit code: {rt?.exitCode ?? cmd.exit_code}
                    </p>
                  )}
                </div>
              );
            })}

            {commands.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">Loading commands…</p>
            )}

            {/* Terminal output */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Output</h4>
                <button
                  onClick={() => {
                    setScrollLocked(!scrollLocked);
                    if (scrollLocked) {
                      setHasNewOutput(false);
                    }
                  }}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  {scrollLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                  {scrollLocked ? "Scroll locked" : "Auto-scroll"}
                </button>
              </div>
              <div className="relative">
                <div
                  ref={termRef}
                  className="rounded-lg p-4 max-h-[300px] overflow-y-auto"
                  style={{
                    backgroundColor: "#0A0A1A",
                    boxShadow: "inset 0 2px 8px rgba(0,0,0,0.4)",
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                    fontSize: "13px",
                    lineHeight: "1.6",
                  }}
                  onScroll={() => {
                    if (!termRef.current) return;
                    const { scrollTop, scrollHeight, clientHeight } = termRef.current;
                    const atBottom = scrollHeight - scrollTop - clientHeight < 30;
                    if (!atBottom && !scrollLocked) {
                      setScrollLocked(true);
                    } else if (atBottom && scrollLocked) {
                      setScrollLocked(false);
                      setHasNewOutput(false);
                    }
                  }}
                >
                  {commandOutputs.map((co, i) => {
                    if (co.lines.length === 0) return null;
                    const risk = RISK_BADGE[co.cmd.risk_tier] ?? RISK_BADGE.low;
                    return (
                      <div key={co.cmd.id}>
                        {/* Command separator */}
                        <div
                          className="flex items-center justify-between py-1.5 mb-1"
                          style={{
                            borderBottom: "1px solid rgba(255,255,255,0.08)",
                            ...(i > 0 ? { borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: "8px", paddingTop: "8px" } : {}),
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <code style={{ color: "#6B7280", fontSize: "11px" }}>
                              $ {(co.cmd.argv_json as string[]).join(" ")}
                            </code>
                            <span
                              className={cn("text-[9px] px-1.5 py-0.5 rounded", risk.className)}
                            >
                              {risk.label}
                            </span>
                          </div>
                          {co.durationMs != null && (
                            <span style={{ color: "#6B7280", fontSize: "11px" }}>
                              {formatDuration(co.durationMs)}
                            </span>
                          )}
                        </div>
                        {/* Output lines */}
                        <pre className="whitespace-pre-wrap m-0" style={{ background: "transparent" }}>
                          {co.lines.map((line, li) => (
                            <span
                              key={li}
                              style={{
                                color: line.stream === "stderr" ? "#EF4444" : "#10B981",
                              }}
                            >
                              {line.text}
                            </span>
                          ))}
                        </pre>
                      </div>
                    );
                  })}

                  {commandOutputs.map((co) => {
                    if (!co.outputUnavailable) return null;
                    return (
                      <div key={`unavail-${co.cmd.id}`} className="py-2">
                        <code style={{ color: "#6B7280", fontSize: "11px" }}>
                          $ {(co.cmd.argv_json as string[]).join(" ")}
                        </code>
                        <p style={{ color: "#6B7280", fontSize: "12px", fontStyle: "italic", marginTop: "4px" }}>
                          Output not available (exceeded storage limit)
                        </p>
                      </div>
                    );
                  })}
                  {commandOutputs.every((co) => co.lines.length === 0 && !co.outputUnavailable) && (
                    <span style={{ color: "hsl(var(--muted-foreground))" }}>
                      Waiting for output…
                    </span>
                  )}
                </div>

                {/* New output badge */}
                {hasNewOutput && scrollLocked && (
                  <button
                    onClick={scrollToBottom}
                    className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-medium bg-blue-500/90 text-white shadow-lg hover:bg-blue-500 transition-colors"
                  >
                    New output <ArrowDown className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="shrink-0 border-t border-border px-5 py-3 flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs" onClick={copyOutput}>
            <Copy className="mr-1.5 h-3 w-3" /> Copy Output
          </Button>
          <Button variant="ghost" size="sm" className="text-xs ml-auto" onClick={onClose}>
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
