import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ShieldCheck, Loader2 } from "lucide-react";
import { TargetMachineSelector } from "./TargetMachineSelector";
import { COLUMNS, type BoardStep, type BoardProject } from "@/hooks/useProjectBoard";
import { type VerifyAllProgress } from "@/hooks/useStepVerification";
import { cn } from "@/lib/utils";

interface Props {
  project: BoardProject;
  steps: BoardStep[];
  selectedMachineId: string | null;
  onMachineChange: (id: string) => void;
  hasFailedPlan?: boolean;
  onVerifyAll?: () => void;
  verifyAllProgress?: VerifyAllProgress | null;
  isDesktop?: boolean;
}

export function BoardHeader({ project, steps, selectedMachineId, onMachineChange, hasFailedPlan, onVerifyAll, verifyAllProgress, isDesktop }: Props) {
  const total = steps.length;
  const liveCount = steps.filter((s) => s.status === "live").length;
  const pct = total > 0 ? Math.round((liveCount / total) * 100) : 0;
  const verifiableCount = steps.filter((s) => s.verify_command && s.status !== "live").length;

  const counts = COLUMNS.map((col) => ({
    ...col,
    count: steps.filter((s) => s.status === col.key).length,
  }));

  const vp = verifyAllProgress;
  const isRunningVerifyAll = vp?.running ?? false;
  const verifyPct = vp && vp.total > 0 ? Math.round((vp.completed / vp.total) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Framework icon */}
        {project.framework_icon_letter && (
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white"
            style={{ backgroundColor: project.framework_icon_color || 'hsl(var(--primary))' }}
          >
            {project.framework_icon_letter}
          </div>
        )}
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">{project.name}</h1>
          {project.framework_name && (
            <p className="text-xs text-muted-foreground">
              {project.framework_name} · {project.framework_language}
            </p>
          )}
        </div>
        <Badge variant="outline" className="border-primary/40 text-primary text-xs capitalize">
          {project.mode}
        </Badge>

        {/* Verify All + Machine selector */}
        <div className="ml-auto flex items-center gap-2">
          {onVerifyAll && verifiableCount > 0 && (
            isRunningVerifyAll && vp ? (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                <div className="flex flex-col gap-0.5 min-w-[120px]">
                  <Progress value={verifyPct} className="h-1.5 bg-muted" />
                  <span className="text-[10px] text-muted-foreground">
                    {vp.completed}/{vp.total} checked
                    {vp.passed > 0 && <span className="text-emerald-400"> · {vp.passed} passed</span>}
                    {vp.failed > 0 && <span className="text-red-400"> · {vp.failed} failed</span>}
                  </span>
                </div>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="text-xs gap-1.5"
                disabled={!isDesktop}
                title={!isDesktop ? "Desktop app required to verify" : `Verify ${verifiableCount} steps`}
                onClick={onVerifyAll}
              >
                <ShieldCheck className="h-3.5 w-3.5" /> Verify All
              </Button>
            )
          )}
          <TargetMachineSelector value={selectedMachineId} onChange={onMachineChange} />
        </div>
      </div>

      {/* Stats bar */}
      <div className={cn(
        "flex flex-wrap gap-2 transition-all duration-300",
        hasFailedPlan && "animate-pulse"
      )}>
        {counts.map((c) => (
          <div
            key={c.key}
            className={cn(
              "flex items-center gap-1.5 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs transition-all duration-300",
              hasFailedPlan && "border-destructive/40"
            )}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
            <span className="text-muted-foreground">{c.label}</span>
            <span className="font-semibold text-foreground">{c.count}</span>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Overall Progress</span>
          <span>{pct}% complete</span>
        </div>
        <Progress value={pct} className="h-2 bg-muted" />
      </div>
    </div>
  );
}
