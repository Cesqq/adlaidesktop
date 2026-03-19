import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Terminal, Eye, Loader2, X } from "lucide-react";
import { type BoardStep, type BoardStatus, COLUMNS, getNextStatus } from "@/hooks/useProjectBoard";
import { type CommandRealtimeState } from "@/hooks/useCommandRealtime";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface Props {
  steps: BoardStep[];
  onAction: (step: BoardStep) => void;
  onCardClick: (step: BoardStep) => void;
  selectedMachineId?: string | null;
  selectedMachineOnline?: boolean;
  stepPlanMap?: Map<string, string>;
  planStatusMap?: Map<string, { status: string; createdAt: string; planId: string }>;
  commandStates?: Map<string, CommandRealtimeState>;
  onRunOnMachine?: (step: BoardStep) => void;
  onViewOutput?: (step: BoardStep) => void;
}

export function MobileColumnTabs({ steps, onAction, onCardClick, selectedMachineId, selectedMachineOnline, stepPlanMap, planStatusMap, commandStates, onRunOnMachine, onViewOutput }: Props) {
  const grouped = COLUMNS.map((col) => ({
    ...col,
    steps: steps.filter((s) => s.status === col.key).sort((a, b) => a.sort_order - b.sort_order),
  }));

  const canRun = !!selectedMachineId && !!selectedMachineOnline;

  return (
    <Tabs defaultValue="plan" className="w-full">
      <TabsList className="w-full overflow-x-auto justify-start bg-muted/30 h-auto p-1 flex-wrap">
        {grouped.map((col) => (
          <TabsTrigger
            key={col.key}
            value={col.key}
            className="text-xs gap-1.5 data-[state=active]:text-foreground"
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: col.color }} />
            {col.label}
            <span className="text-[10px] text-muted-foreground">({col.steps.length})</span>
          </TabsTrigger>
        ))}
      </TabsList>

      {grouped.map((col) => (
        <TabsContent key={col.key} value={col.key} className="space-y-2 mt-3">
          {col.steps.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">No steps in this column</p>
          )}
          {col.steps.map((step) => {
            const activePlanId = stepPlanMap?.get(step.step_id) ?? null;
            const lastRun = planStatusMap?.get(step.step_id) ?? null;
            const cmdState = activePlanId ? commandStates?.get(activePlanId) : undefined;
            const isRunning = cmdState?.hasRunning ?? false;
            return (
              <div
                key={step.id}
                onClick={() => onCardClick(step)}
                className={cn(
                  "relative rounded-xl border border-border bg-card p-3 space-y-2 cursor-pointer transition-all duration-300",
                  isRunning && "border-blue-500/50"
                )}
              >
                {isRunning && (
                  <div className="absolute top-2 right-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{step.title}</span>
                  <span className="text-[10px] text-muted-foreground">~{step.estimated_minutes} min</span>
                </div>
                {step.status !== "live" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-8 text-xs"
                    style={{ borderColor: col.color, color: col.color }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAction(step);
                    }}
                  >
                    {step.status === "validate" ? <Check className="mr-1 h-3 w-3" /> : <ArrowRight className="mr-1 h-3 w-3" />}
                    Move to {COLUMNS.find((c) => c.key === getNextStatus(step.status))?.label}
                  </Button>
                )}
                {step.status !== "live" && onRunOnMachine && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-8 text-xs"
                    disabled={!canRun || !!activePlanId}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRunOnMachine(step);
                    }}
                  >
                    <Terminal className="mr-1 h-3 w-3" /> Run on Machine
                  </Button>
                )}
                {activePlanId && onViewOutput && (
                  <button
                    className="w-full flex items-center justify-center gap-1 text-[10px] text-primary hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewOutput(step);
                    }}
                  >
                    <Eye className="h-3 w-3" /> View Output
                  </button>
                )}
                {/* Last run info */}
                {lastRun && (
                  <button
                    className={cn(
                      "w-full flex items-center justify-center gap-1.5 text-[10px] transition-colors hover:underline",
                      lastRun.status === "running" && "text-blue-400",
                      lastRun.status === "succeeded" && "text-green-400",
                      lastRun.status === "failed" && "text-destructive",
                      !["running", "succeeded", "failed"].includes(lastRun.status) && "text-muted-foreground"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewOutput?.(step);
                    }}
                  >
                    {lastRun.status === "running" && <Loader2 className="h-3 w-3 animate-spin" />}
                    {lastRun.status === "succeeded" && <Check className="h-3 w-3" />}
                    {lastRun.status === "failed" && <X className="h-3 w-3" />}
                    Last run: {lastRun.status} · {formatDistanceToNow(new Date(lastRun.createdAt), { addSuffix: true })}
                  </button>
                )}
              </div>
            );
          })}
        </TabsContent>
      ))}
    </Tabs>
  );
}
