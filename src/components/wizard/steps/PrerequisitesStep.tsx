import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, X, ExternalLink, Copy, CheckCheck, Loader2, RefreshCw, Terminal, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  isTauri,
  checkPrerequisite,
  runCommand,
  type OutputLine,
} from "@/hooks/useTauriCommands";
import type { OS } from "@/types/wizard";

interface Props {
  frameworkSlug: string;
  os: OS | null;
  verified: Record<string, boolean>;
  onVerifiedChange: (v: Record<string, boolean>) => void;
}

interface Prerequisite {
  id: string;
  name: string;
  check_command: string | null;
  expected_version: string | null;
  install_url: string | null;
  install_command_mac: string | null;
  install_command_windows: string | null;
  install_command_linux: string | null;
  required: boolean;
  sort_order: number;
}

type CheckStatus = "idle" | "checking" | "installed" | "outdated" | "not_found" | "error";

interface CheckResult {
  status: CheckStatus;
  version?: string | null;
  error?: string | null;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CopyableCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 font-mono text-xs">
      <code className="flex-1 text-foreground">{command}</code>
      <button onClick={copy} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
        {copied ? <CheckCheck className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

function InlineTerminal({ lines }: { lines: string[] }) {
  const ref = useRef<HTMLPreElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [lines.length]);

  if (lines.length === 0) return null;
  return (
    <div className="mt-2 rounded-lg overflow-hidden border border-border/50">
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0A0A1A] border-b border-border/30">
        <Terminal className="h-3 w-3 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground">Install output</span>
      </div>
      <pre
        ref={ref}
        className="whitespace-pre-wrap m-0 px-3 py-2 max-h-[150px] overflow-y-auto text-xs leading-relaxed"
        style={{
          backgroundColor: "#0A0A1A",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          fontSize: "12px",
        }}
      >
        {lines.map((line, i) => (
          <span key={i} style={{ color: "#10B981" }}>
            {line}
            {"\n"}
          </span>
        ))}
      </pre>
    </div>
  );
}

function StatusBadge({ result, expectedVersion }: { result: CheckResult; expectedVersion?: string | null }) {
  switch (result.status) {
    case "checking":
      return (
        <span className="flex items-center gap-1 text-xs text-blue-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking…
        </span>
      );
    case "installed":
      return (
        <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
          <Check className="h-3.5 w-3.5" /> Installed{result.version ? ` (v${result.version})` : ""}
        </span>
      );
    case "outdated":
      return (
        <span className="flex items-center gap-1 text-xs font-medium text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5" /> Outdated{result.version ? ` (v${result.version}` : ""}
          {expectedVersion ? `, need v${expectedVersion}+)` : ")"}
        </span>
      );
    case "not_found":
      return (
        <span className="flex items-center gap-1 text-xs text-red-400">
          <X className="h-3.5 w-3.5" /> Not Found
        </span>
      );
    case "error":
      return (
        <span className="flex items-center gap-1 text-xs text-red-400">
          <X className="h-3.5 w-3.5" /> Error
        </span>
      );
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function PrerequisitesStep({ frameworkSlug, os, verified, onVerifiedChange }: Props) {
  const isDesktop = isTauri();

  const [checkResults, setCheckResults] = useState<Record<string, CheckResult>>({});
  const [installOutput, setInstallOutput] = useState<Record<string, string[]>>({});
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [recheckKey, setRecheckKey] = useState(0);

  // We keep a ref to the latest verified state so the auto-check callback
  // always merges into the most recent value (avoids stale-closure issues).
  const verifiedRef = useRef(verified);
  verifiedRef.current = verified;

  const { data: prerequisites, isLoading } = useQuery({
    queryKey: ["framework-prerequisites", frameworkSlug],
    queryFn: async () => {
      const { data: fw } = await (supabase as any)
        .from("frameworks")
        .select("id")
        .eq("slug", frameworkSlug)
        .single();
      if (!fw) return [];

      const { data, error } = await (supabase as any)
        .from("framework_prerequisites")
        .select("*")
        .eq("framework_id", fw.id)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Prerequisite[];
    },
    enabled: !!frameworkSlug,
  });

  const getInstallCommand = (p: Prerequisite): string | null => {
    if (!os) return null;
    if (os === "macos") return p.install_command_mac;
    if (os === "windows") return p.install_command_windows;
    if (os === "linux") return p.install_command_linux;
    return null;
  };

  const toggleVerified = (id: string) => {
    onVerifiedChange({ ...verified, [id]: !verified[id] });
  };

  // Run a single prerequisite check
  const checkOne = useCallback(
    async (p: Prerequisite) => {
      if (!p.check_command) return;
      setCheckResults((prev) => ({ ...prev, [p.id]: { status: "checking" } }));
      try {
        const result = await checkPrerequisite(p.name, p.check_command, p.expected_version);
        if (!result) {
          setCheckResults((prev) => ({ ...prev, [p.id]: { status: "error", error: "Check unavailable" } }));
          return;
        }
        let status: CheckStatus;
        if (!result.installed) {
          status = "not_found";
        } else if (!result.meets_requirement && p.expected_version) {
          status = "outdated";
        } else {
          status = "installed";
        }
        setCheckResults((prev) => ({
          ...prev,
          [p.id]: { status, version: result.version, error: result.error },
        }));
        if (status === "installed") {
          onVerifiedChange({ ...verifiedRef.current, [p.id]: true });
        }
      } catch (err: any) {
        setCheckResults((prev) => ({
          ...prev,
          [p.id]: { status: "error", error: err.message || "Unknown error" },
        }));
      }
    },
    [onVerifiedChange],
  );

  // Auto-check on mount when in Tauri
  useEffect(() => {
    if (!isDesktop || !prerequisites?.length) return;
    for (const p of prerequisites) {
      if (p.check_command) checkOne(p);
    }
  }, [prerequisites, isDesktop, recheckKey, checkOne]);

  // Handle install
  const handleInstall = async (p: Prerequisite) => {
    const cmd = getInstallCommand(p);
    if (!cmd) return;
    setInstallingId(p.id);
    setInstallOutput((prev) => ({ ...prev, [p.id]: [] }));
    try {
      await runCommand(cmd, [], (data: OutputLine) => {
        setInstallOutput((prev) => ({
          ...prev,
          [p.id]: [...(prev[p.id] || []), data.line],
        }));
      });
      await checkOne(p);
    } catch (err: any) {
      setInstallOutput((prev) => ({
        ...prev,
        [p.id]: [...(prev[p.id] || []), `Error: ${err.message}`],
      }));
    } finally {
      setInstallingId(null);
    }
  };

  const totalRequired = (prerequisites ?? []).filter((p) => p.required).length;
  const verifiedRequired = (prerequisites ?? []).filter((p) => p.required && verified[p.id]).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Prerequisites Check</h2>
          <p className="mt-2 text-muted-foreground">
            {isDesktop ? (
              "Automatically checking your installed tools…"
            ) : (
              <>
                Verify these requirements are installed on your machine.{" "}
                <span className="text-xs text-muted-foreground/70">
                  (Run checks automatically with the Desktop App)
                </span>
              </>
            )}
          </p>
        </div>
        {isDesktop && prerequisites && prerequisites.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 text-xs gap-1.5"
            onClick={() => setRecheckKey((k) => k + 1)}
          >
            <RefreshCw className="h-3.5 w-3.5" /> Re-check All
          </Button>
        )}
      </div>

      {/* Loading skeleton */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {(prerequisites ?? []).map((p) => {
            const isVerified = !!verified[p.id];
            const installCmd = getInstallCommand(p);
            const result = checkResults[p.id];
            const hasAutoResult = isDesktop && result && result.status !== "idle";
            const isFailed = result?.status === "not_found" || result?.status === "outdated";
            const isInstalling = installingId === p.id;
            const terminalLines = installOutput[p.id] || [];

            return (
              <div
                key={p.id}
                className={cn(
                  "rounded-xl border p-4 space-y-3 transition-all",
                  isVerified
                    ? "border-emerald-500/40 bg-emerald-500/5"
                    : isFailed
                      ? "border-red-500/20 bg-red-500/5"
                      : "border-border bg-card",
                )}
              >
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-heading text-sm font-semibold text-foreground">{p.name}</span>
                    {!p.required && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                        Optional
                      </span>
                    )}
                    {p.expected_version && (
                      <span className="text-xs text-muted-foreground">v{p.expected_version}+</span>
                    )}
                  </div>

                  {hasAutoResult ? (
                    <StatusBadge result={result} expectedVersion={p.expected_version} />
                  ) : isVerified ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
                      <Check className="h-3.5 w-3.5" /> Verified
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <X className="h-3.5 w-3.5" /> Not verified
                    </span>
                  )}
                </div>

                {/* Check command — show in browser mode, or when failed in desktop */}
                {p.check_command && (!isDesktop || isFailed || result?.status === "error") && (
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-1">Run to check:</p>
                    <CopyableCommand command={p.check_command} />
                  </div>
                )}

                {/* Install command — show when not verified/installed */}
                {installCmd && !isVerified && (!hasAutoResult || isFailed) && (
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-1">Install command ({os}):</p>
                    <CopyableCommand command={installCmd} />
                  </div>
                )}

                {/* Error message */}
                {result?.status === "error" && result.error && (
                  <p className="text-xs text-red-400">{result.error}</p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3">
                  {isDesktop && isFailed && installCmd && (
                    <Button
                      size="sm"
                      variant="default"
                      className="h-7 text-xs gap-1.5"
                      disabled={isInstalling}
                      onClick={() => handleInstall(p)}
                    >
                      {isInstalling ? (
                        <><Loader2 className="h-3 w-3 animate-spin" /> Installing…</>
                      ) : (
                        <><Terminal className="h-3 w-3" /> Install</>
                      )}
                    </Button>
                  )}

                  {(!isDesktop || !p.check_command || result?.status === "error") && (
                    <Button
                      size="sm"
                      variant={isVerified ? "outline" : "default"}
                      className={cn("h-7 text-xs", isVerified && "border-emerald-500/40 text-emerald-400")}
                      onClick={() => toggleVerified(p.id)}
                    >
                      {isVerified ? "Undo" : "I've verified this"}
                    </Button>
                  )}

                  {p.install_url && (
                    <a
                      href={p.install_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      Download <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                {/* Inline terminal for install output */}
                {(isInstalling || terminalLines.length > 0) && (
                  <InlineTerminal lines={terminalLines} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Progress summary */}
      {totalRequired > 0 && (
        <div className="rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          {verifiedRequired}/{totalRequired} required prerequisites verified
        </div>
      )}
    </div>
  );
}
