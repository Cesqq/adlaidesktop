import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Machine {
  id: string;
  machine_label: string;
  os_family: string;
  last_seen_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

export function isOnline(machine: Machine): boolean {
  if (!machine.last_seen_at) return false;
  return Date.now() - new Date(machine.last_seen_at).getTime() < 2 * 60 * 1000;
}

export function useMachines() {
  const query = useQuery({
    queryKey: ["machines-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("machines")
        .select("*")
        .is("revoked_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Machine[];
    },
  });

  return { machines: query.data ?? [], isLoading: query.isLoading };
}
