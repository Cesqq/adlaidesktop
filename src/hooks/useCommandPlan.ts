import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { stepCommandMap } from "@/lib/stepCommandMap";

export interface CommandPlanRow {
  id: string;
  project_id: string;
  step_id: string;
  machine_id: string;
  status: string;
  created_at: string;
}

export interface CommandRow {
  id: string;
  plan_id: string;
  seq: number;
  argv_json: string[];
  risk_tier: string;
  requires_approval: boolean;
  state: string;
  exit_code: number | null;
  started_at: string | null;
  finished_at: string | null;
}

export interface CommandOutputRow {
  command_id: string;
  output_text: string;
  truncated: boolean;
}

export function useProjectPlans(projectId: string | undefined) {
  return useQuery({
    queryKey: ["command-plans", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("command_plans")
        .select("*")
        .eq("project_id", projectId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CommandPlanRow[];
    },
    enabled: !!projectId,
    refetchInterval: 5000,
  });
}

export function usePlanDetail(planId: string | null) {
  const planQuery = useQuery({
    queryKey: ["command-plan-detail", planId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("command_plans")
        .select("*")
        .eq("id", planId!)
        .single();
      if (error) throw error;
      return data as CommandPlanRow;
    },
    enabled: !!planId,
    refetchInterval: 3000,
  });

  const commandsQuery = useQuery({
    queryKey: ["command-plan-commands", planId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commands")
        .select("*")
        .eq("plan_id", planId!)
        .order("seq", { ascending: true });
      if (error) throw error;
      return (data as any[]).map((c) => ({
        ...c,
        argv_json: c.argv_json as string[],
      })) as CommandRow[];
    },
    enabled: !!planId,
    refetchInterval: 3000,
  });

  const commandIds = commandsQuery.data?.map((c) => c.id) ?? [];

  const outputsQuery = useQuery({
    queryKey: ["command-plan-outputs", planId, commandIds.join(",")],
    queryFn: async () => {
      if (commandIds.length === 0) return [];
      const { data, error } = await supabase
        .from("command_outputs")
        .select("*")
        .in("command_id", commandIds);
      if (error) throw error;
      return data as CommandOutputRow[];
    },
    enabled: !!planId && commandIds.length > 0,
    refetchInterval: 3000,
  });

  return {
    plan: planQuery.data ?? null,
    machineId: planQuery.data?.machine_id ?? null,
    commands: commandsQuery.data ?? [],
    outputs: outputsQuery.data ?? [],
    isLoading: planQuery.isLoading,
  };
}

export function useCreatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      stepId,
      machineId,
      stepCode,
    }: {
      projectId: string;
      stepId: string;
      machineId: string;
      stepCode: string;
    }) => {
      const { data: plan, error: planErr } = await supabase
        .from("command_plans")
        .insert({ project_id: projectId, step_id: stepId, machine_id: machineId, status: "queued" })
        .select()
        .single();
      if (planErr) throw planErr;

      const defs = stepCommandMap[stepCode] ?? [
        { argv_json: ["echo", "No commands defined for this step"], risk_tier: "low", requires_approval: false },
      ];

      const commandRows = defs.map((d, i) => ({
        plan_id: plan.id,
        seq: i + 1,
        argv_json: d.argv_json as any,
        risk_tier: d.risk_tier,
        requires_approval: d.requires_approval,
      }));

      const { error: cmdErr } = await supabase.from("commands").insert(commandRows);
      if (cmdErr) throw cmdErr;

      return plan as CommandPlanRow;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["command-plans", vars.projectId] });
    },
  });
}
