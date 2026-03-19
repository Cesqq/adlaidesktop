import { Draggable } from "@hello-pangea/dnd";
import { Clock, Check, ArrowRight, AlertCircle, Play, Settings, ShieldCheck, Terminal, Eye, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type BoardStep, type BoardStatus, COLUMNS, getNextStatus, CATEGORY_COLORS } from "@/hooks/useProjectBoard";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const ACTION_LABELS: Record<BoardStatus, { label: string; icon: typeof Play }> = {
  plan: { label: "Start", icon: Play },
  ready: { label: "Begin Setup", icon: ArrowRight },
  needs_info: { label: "Add Info", icon: AlertCircle },
  setup: { label: "Continue", icon: Settings },
  validate: { label: "Verify", icon: ShieldCheck },
  live: { label: "", icon: Check },
};

interface LastRun {
  status: string;
  createdAt: string;
  planId: string;
}

interface Props {
  step: BoardStep;
  index: number;
  onAction: (step: BoardStep) => void;
  onClick: (step: BoardStep) => void;
  selectedMachineId?: string | null;
  selectedMachineOnline?: boolean;
  activePlanId?: string | null;
  onRunOnMachine?: (step: BoardStep) => void;
  onViewOutput?: (step: BoardStep) => void;
  lastRun?: LastRun | null;
  commandRunning?: boolean;
}

export function StepCard({ step, index, onAction, onClick, selectedMachineId, selectedMachineOnline, activePlanId, onRunOnMachine, onViewOutput, lastRun, commandRunning }: Props) {
  const col = COLUMNS.find((c) => c.key === step.status);
  const action = ACTION_LABELS[step.status];
  const canRun = !!selectedMachineId && !!selectedMachineOnline && !activePlanId;
  const catColor = CATEGORY_COLORS[step.category] ?? { bg: "rgba(100,100,100,0.15)", text: "#999" };

  return (
    <Draggable draggableId={step.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(step)}
          className={cn(
            "relative rounded-xl border bg-card p-3 space-y-2 cursor-pointer transition-all duration-300",
            snapshot.isDragging
              ? "border-primary shadow-lg shadow-primary/20 rotate-1"
              : "border-border hover:border-primary/50 hover:-translate-y-0.5",
            commandRunning && "border-blue-500/50"
          )}
        >
          {/* Running spinner overlay */}
          {commandRunning && (
            <div className="absolute top-2 right-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
            </div>
          )}

          {/* Title */}
          <span className="text-sm font-medium text-foreground leading-tight block">{step.title}</span>

          {/* Description */}
          <p className="text-xs text-muted-foreground line-clamp-2">
            {step.description ?? "Complete this setup step"}
          </p>

          {/* Needs info warning */}
          {step.status === "needs_info" && (
            <p className="text-xs text-warning flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> Missing API key or config
            </p>
          )}

          {/* Tags row */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Category badge */}
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
              style={{ backgroundColor: catColor.bg, color: catColor.text }}
            >
              {step.category}
            </span>
            {step.estimated_minutes && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground ml-auto">
                <Clock className="h-3 w-3" /> ~{step.estimated_minutes} min
              </span>
            )}
          </div>

          {/* Action button */}
          {step.status !== "live" && (
            <Button
              size="sm"
              variant="ghost"
              className="w-full h-7 text-xs mt-1"
              style={{ color: col?.color }}
              onClick={(e) => {
                e.stopPropagation();
                onAction(step);
              }}
            >
              <action.icon className="mr-1 h-3 w-3" />
              {action.label}
            </Button>
          )}

          {step.status === "live" && (
            <div className="flex justify-center">
              <Check className="h-4 w-4 text-green-500" />
            </div>
          )}

          {/* Run on Machine button */}
          {step.status !== "live" && onRunOnMachine && (
            <Button
              size="sm"
              variant="outline"
              className="w-full h-7 text-xs"
              disabled={!canRun}
              onClick={(e) => {
                e.stopPropagation();
                onRunOnMachine(step);
              }}
            >
              <Terminal className="mr-1 h-3 w-3" />
              Run on Machine
            </Button>
          )}

          {/* View Output link */}
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
      )}
    </Draggable>
  );
}
