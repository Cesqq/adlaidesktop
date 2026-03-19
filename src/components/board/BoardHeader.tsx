import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TargetMachineSelector } from "./TargetMachineSelector";
import { COLUMNS, type BoardStep, type BoardProject } from "@/hooks/useProjectBoard";
import { cn } from "@/lib/utils";

interface Props {
  project: BoardProject;
  steps: BoardStep[];
  selectedMachineId: string | null;
  onMachineChange: (id: string) => void;
  hasFailedPlan?: boolean;
}

export function BoardHeader({ project, steps, selectedMachineId, onMachineChange, hasFailedPlan }: Props) {
  const total = steps.length;
  const liveCount = steps.filter((s) => s.status === "live").length;
  const pct = total > 0 ? Math.round((liveCount / total) * 100) : 0;

  const counts = COLUMNS.map((col) => ({
    ...col,
    count: steps.filter((s) => s.status === col.key).length,
  }));

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
        <div className="ml-auto">
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
