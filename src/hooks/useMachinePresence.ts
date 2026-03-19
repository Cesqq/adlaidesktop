import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface UseMachinePresenceOpts {
  userId: string | undefined;
  selectedMachineId: string | null;
  hasRunningPlan: boolean;
}

export function useMachinePresence({ userId, selectedMachineId, hasRunningPlan }: UseMachinePresenceOpts) {
  const [onlineMachineIds, setOnlineMachineIds] = useState<Set<string>>(new Set());
  const [connectionLost, setConnectionLost] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const prevOnlineRef = useRef(false);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase.channel(`presence:${userId}`);

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const ids = new Set<string>();
        Object.values(state).forEach((presences) => {
          (presences as any[]).forEach((p) => {
            if (p.machine_id) ids.add(p.machine_id);
          });
        });
        setOnlineMachineIds(ids);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [userId]);

  // Track connection loss for selected machine
  useEffect(() => {
    const isOnline = selectedMachineId ? onlineMachineIds.has(selectedMachineId) : false;

    if (prevOnlineRef.current && !isOnline && hasRunningPlan) {
      setConnectionLost(true);
    } else if (isOnline) {
      setConnectionLost(false);
    }

    prevOnlineRef.current = isOnline;
  }, [selectedMachineId, onlineMachineIds, hasRunningPlan]);

  return { onlineMachineIds, connectionLost };
}
