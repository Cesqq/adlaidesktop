import { useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type PlanStatus = "free" | "active" | "past_due" | "canceled" | "trialing";

interface SubscriptionData {
  plan_status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  stripe_customer_id: string | null;
}

export function useSubscription() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async (): Promise<SubscriptionData | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("subscriptions")
        .select("plan_status, current_period_end, cancel_at_period_end, stripe_customer_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as SubscriptionData | null;
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["subscription", user?.id] });
  }, [queryClient, user?.id]);

  // Refresh on window focus (e.g. after checkout in another tab)
  useEffect(() => {
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  const planStatus = (data?.plan_status ?? "free") as PlanStatus;
  const isPremium = planStatus === "active" || planStatus === "trialing";
  // Keep isPro as alias for backwards compat with sidebar
  const isPro = isPremium;

  return {
    isPremium,
    isPro,
    planStatus,
    currentPeriodEnd: data?.current_period_end ?? null,
    cancelAtPeriodEnd: data?.cancel_at_period_end ?? false,
    isLoading,
    refresh,
  };
}
