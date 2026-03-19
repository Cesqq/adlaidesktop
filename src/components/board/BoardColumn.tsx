import { Droppable } from "@hello-pangea/dnd";
import { StepCard } from "./StepCard";
import { type BoardStep } from "@/hooks/useProjectBoard";
import { type CommandRealtimeState } from "@/hooks/useCommandRealtime";
import { cn } from "@/lib/utils";

interface Props {
  columnKey: string;
  label: string;
  color: string;
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

export function BoardColumn({ columnKey, label, color, steps, onAction, onCardClick, selectedMachineId, selectedMachineOnline, stepPlanMap, planStatusMap, commandStates, onRunOnMachine, onViewOutput }: Props) {
  return (
    <div className="flex w-64 shrink-0 flex-col rounded-xl border border-border bg-muted/20 lg:w-auto lg:shrink">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-sm font-semibold text-foreground">{label}</span>
        <span
          className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{ backgroundColor: color + "22", color }}
        >
          {steps.length}
        </span>
      </div>

      {/* Droppable area */}
      <Droppable droppableId={columnKey}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 space-y-2 p-2 min-h-[80px] transition-colors",
              snapshot.isDraggingOver && "bg-primary/5"
            )}
          >
            {steps
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((step, i) => {
                const planId = stepPlanMap?.get(step.step_id) ?? null;
                const lastRun = planStatusMap?.get(step.step_id) ?? null;
                const cmdState = planId ? commandStates?.get(planId) : undefined;
                return (
                  <StepCard
                    key={step.id}
                    step={step}
                    index={i}
                    onAction={onAction}
                    onClick={onCardClick}
                    selectedMachineId={selectedMachineId}
                    selectedMachineOnline={selectedMachineOnline}
                    activePlanId={planId}
                    onRunOnMachine={onRunOnMachine}
                    onViewOutput={onViewOutput}
                    lastRun={lastRun}
                    commandRunning={cmdState?.hasRunning ?? false}
                  />
                );
              })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
