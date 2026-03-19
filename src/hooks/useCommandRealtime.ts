import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { CommandPlanRow } from "./useCommandPlan";
import type { BoardStep, BoardStatus } from "./useProjectBoard";

export interface CommandRealtimeState {
  latestCommandState: string;
  hasRunning: boolean;
  hasFailed: boolean;
  hasSucceeded: boolean;
}

interface UseCommandRealtimeOpts {
  projectId: string | undefined;
  plans: CommandPlanRow[] | undefined;
  steps: BoardStep[];
  moveStep: { mutate: (args: { stepStatusId: string; newStatus: BoardStatus }) => void };
}

export function useCommandRealtime({ projectId, plans, steps, moveStep }: UseCommandRealtimeOpts) {
  const [commandStates, setCommandStates] = useState<Map<string, CommandRealtimeState>>(new Map());
  const [hasFailedPlan, setHasFailedPlan] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const failedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Build a set of plan_ids belonging to this project for fast lookup
  const planIds = new Set((plans ?? []).map((p) => p.id));
  // Map plan step_id → step status row id for moving cards
  const planStepMap = new Map<string, { stepStatusId: string; stepId: string }>();
  (plans ?? []).forEach((p) => {
    const step = steps.find((s) => s.step_id === p.step_id);
    if (step) planStepMap.set(p.id, { stepStatusId: step.id, stepId: step.step_id });
  });

  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`commands-realtime-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "commands",
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            plan_id: string;
            state: string;
            exit_code: number | null;
            seq: number;
          };

          if (!planIds.has(row.plan_id)) return;

          const mapping = planStepMap.get(row.plan_id);
          if (!mapping) return;

          // Update command states map
          setCommandStates((prev) => {
            const next = new Map(prev);
            const existing = next.get(row.plan_id) ?? {
              latestCommandState: row.state,
              hasRunning: false,
              hasFailed: false,
              hasSucceeded: false,
            };

            next.set(row.plan_id, {
              latestCommandState: row.state,
              hasRunning: existing.hasRunning || row.state === "running",
              hasFailed: existing.hasFailed || row.state === "failed",
              hasSucceeded: row.state === "succeeded",
            });
            return next;
          });

          // Auto-move cards based on command state
          if (row.state === "running") {
            const step = steps.find((s) => s.step_id === mapping.stepId);
            if (step && step.status !== "setup" && step.status !== "live") {
              moveStep.mutate({ stepStatusId: mapping.stepStatusId, newStatus: "setup" });
            }
          } else if (row.state === "succeeded") {
            // Only move to validate if this might be the last command
            const step = steps.find((s) => s.step_id === mapping.stepId);
            if (step && step.status !== "validate" && step.status !== "live") {
              moveStep.mutate({ stepStatusId: mapping.stepStatusId, newStatus: "validate" });
            }
          } else if (row.state === "failed") {
            // Pulse the stats bar red for 2s
            setHasFailedPlan(true);
            if (failedTimerRef.current) clearTimeout(failedTimerRef.current);
            failedTimerRef.current = setTimeout(() => setHasFailedPlan(false), 2000);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
      if (failedTimerRef.current) clearTimeout(failedTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, plans?.length]);

  return { commandStates, hasFailedPlan };
}
