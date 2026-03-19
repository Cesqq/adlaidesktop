import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type BoardStatus = "plan" | "ready" | "needs_info" | "setup" | "validate" | "live";

export interface BoardStep {
  id: string;
  project_id: string;
  step_id: string;
  status: BoardStatus;
  notes: string | null;
  completed_at: string | null;
  title: string;
  description: string | null;
  category: string;
  estimated_minutes: number | null;
  sort_order: number;
  verify_command: string | null;
  verify_expected: string | null;
  // Keep legacy fields for compatibility
  step_code: string;
  risk_level: string;
}

export interface BoardProject {
  id: string;
  name: string;
  mode: string;
  status: string;
  skill_level: string | null;
  created_at: string;
  framework_id: string;
  framework_name?: string;
  framework_icon_letter?: string;
  framework_icon_color?: string;
  framework_language?: string;
}

export const COLUMNS: { key: BoardStatus; label: string; color: string }[] = [
  { key: "plan", label: "Plan", color: "#6366F1" },
  { key: "ready", label: "Ready", color: "#06B6D4" },
  { key: "needs_info", label: "Needs Info", color: "#F59E0B" },
  { key: "setup", label: "Setup", color: "#764BA2" },
  { key: "validate", label: "Validate", color: "#667EEA" },
  { key: "live", label: "Live", color: "#10B981" },
];

const NEXT_STATUS: Record<BoardStatus, BoardStatus> = {
  plan: "ready",
  ready: "setup",
  needs_info: "ready",
  setup: "validate",
  validate: "live",
  live: "live",
};

export function getNextStatus(current: BoardStatus): BoardStatus {
  return NEXT_STATUS[current];
}

export const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  prerequisites: { bg: "rgba(99, 102, 241, 0.15)", text: "#6366F1" },
  install: { bg: "rgba(16, 185, 129, 0.15)", text: "#10B981" },
  configure: { bg: "rgba(245, 158, 11, 0.15)", text: "#F59E0B" },
  security: { bg: "rgba(239, 68, 68, 0.15)", text: "#EF4444" },
  channels: { bg: "rgba(139, 92, 246, 0.15)", text: "#8B5CF6" },
  verify: { bg: "rgba(6, 182, 212, 0.15)", text: "#06B6D4" },
};

export function useProjectBoard(projectId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ["project-board", projectId];

  const projectQuery = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("setup_projects")
        .select("*")
        .eq("id", projectId!)
        .single();
      if (error) throw error;

      // Fetch framework info
      let fwData: { name: string; icon_letter: string; icon_color: string; language: string } | null = null;
      if ((data as any).framework_id) {
        const { data: fw } = await (supabase as any)
          .from("frameworks")
          .select("name, icon_letter, icon_color, language")
          .eq("id", (data as any).framework_id)
          .single();
        fwData = fw as any;
      }

      return {
        id: data.id,
        name: data.name,
        mode: data.mode,
        status: data.status,
        skill_level: data.skill_level,
        created_at: data.created_at,
        framework_id: (data as any).framework_id ?? '',
        framework_name: fwData?.name ?? null,
        framework_icon_letter: fwData?.icon_letter ?? null,
        framework_icon_color: fwData?.icon_color ?? null,
        framework_language: fwData?.language ?? null,
      } as BoardProject;
    },
    enabled: !!projectId,
  });

  const stepsQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const { data: statuses, error: sErr } = await supabase
        .from("project_step_status")
        .select("*")
        .eq("project_id", projectId!);
      if (sErr) throw sErr;

      const stepIds = statuses.map((s) => s.step_id);
      if (stepIds.length === 0) return [];

      // Query framework_setup_steps instead of setup_steps
      const { data: rawSteps, error: stErr } = await (supabase as any)
        .from("framework_setup_steps")
        .select("*")
        .in("id", stepIds);
      if (stErr) throw stErr;
      const steps = (rawSteps ?? []) as any[];

      const stepMap = new Map(steps.map((s: any) => [s.id, s]));

      return statuses
        .map((s) => {
          const step = stepMap.get(s.step_id);
          if (!step) return null;
          return {
            id: s.id,
            project_id: s.project_id,
            step_id: s.step_id,
            status: (s.status === "pending" ? "plan" : s.status) as BoardStatus,
            notes: s.notes,
            completed_at: s.completed_at,
            title: step.title,
            description: step.description,
            category: step.category,
            estimated_minutes: step.estimated_minutes,
            sort_order: step.sort_order,
            verify_command: step.verify_command,
            verify_expected: step.verify_expected,
            // Legacy compat
            step_code: `fw_step_${step.sort_order}`,
            risk_level: "low",
          } as BoardStep;
        })
        .filter(Boolean) as BoardStep[];
    },
    enabled: !!projectId,
  });

  const moveStep = useMutation({
    mutationFn: async ({ stepStatusId, newStatus }: { stepStatusId: string; newStatus: BoardStatus }) => {
      const updateData: Record<string, any> = { status: newStatus };
      if (newStatus === "live") updateData.completed_at = new Date().toISOString();
      const { error } = await supabase
        .from("project_step_status")
        .update(updateData)
        .eq("id", stepStatusId);
      if (error) throw error;
    },
    onMutate: async ({ stepStatusId, newStatus }) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<BoardStep[]>(queryKey);
      queryClient.setQueryData<BoardStep[]>(queryKey, (old) =>
        old?.map((s) => (s.id === stepStatusId ? { ...s, status: newStatus } : s))
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKey, ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  return { project: projectQuery.data, steps: stepsQuery.data ?? [], isLoading: projectQuery.isLoading || stepsQuery.isLoading, moveStep };
}
