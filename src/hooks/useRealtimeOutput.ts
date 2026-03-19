import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface OutputChunk {
  command_id: string;
  seq: number;
  stream: "stdout" | "stderr";
  text: string;
  timestamp: string;
}

export interface CommandStreamState {
  chunks: OutputChunk[];
  done: boolean;
  exitCode?: number;
  durationMs?: number;
}

export type StreamedOutputMap = Map<string, CommandStreamState>;

export function useRealtimeOutput(
  machineId: string | null | undefined,
  planId: string | null | undefined
) {
  const [streamedOutput, setStreamedOutput] = useState<StreamedOutputMap>(
    new Map()
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  // Buffer for out-of-order chunks keyed by command_id
  const bufferRef = useRef<Map<string, OutputChunk[]>>(new Map());
  const nextSeqRef = useRef<Map<string, number>>(new Map());

  const flushBuffer = useCallback(
    (commandId: string) => {
      const buffer = bufferRef.current.get(commandId) ?? [];
      const nextSeq = nextSeqRef.current.get(commandId) ?? 1;

      // Sort buffer by seq
      buffer.sort((a, b) => a.seq - b.seq);

      const toFlush: OutputChunk[] = [];
      let current = nextSeq;
      while (buffer.length > 0 && buffer[0].seq <= current) {
        const chunk = buffer.shift()!;
        if (chunk.seq === current) {
          toFlush.push(chunk);
          current++;
        }
        // Skip duplicates (seq < current)
      }
      nextSeqRef.current.set(commandId, current);
      bufferRef.current.set(commandId, buffer);

      if (toFlush.length > 0) {
        setStreamedOutput((prev) => {
          const next = new Map(prev);
          const state = next.get(commandId) ?? {
            chunks: [],
            done: false,
          };
          next.set(commandId, {
            ...state,
            chunks: [...state.chunks, ...toFlush],
          });
          return next;
        });
      }
    },
    []
  );

  useEffect(() => {
    if (!machineId || !planId) return;

    // Reset state for new subscription
    setStreamedOutput(new Map());
    setIsStreaming(true);
    bufferRef.current = new Map();
    nextSeqRef.current = new Map();

    const channelName = `output:${machineId}`;
    const channel = supabase.channel(channelName);

    channel
      .on("broadcast", { event: "out:chunk" }, (payload) => {
        const msg = payload.payload as {
          plan_id: string;
          command_id: string;
          seq: number;
          stream: "stdout" | "stderr";
          data: string; // base64
          timestamp: string;
        };

        if (msg.plan_id !== planId) return;

        // Decode base64 data
        let text: string;
        try {
          text = atob(msg.data);
        } catch {
          text = msg.data; // fallback if not base64
        }

        const chunk: OutputChunk = {
          command_id: msg.command_id,
          seq: msg.seq,
          stream: msg.stream,
          text,
          timestamp: msg.timestamp,
        };

        // Add to buffer
        const buffer = bufferRef.current.get(msg.command_id) ?? [];
        buffer.push(chunk);
        bufferRef.current.set(msg.command_id, buffer);

        if (!nextSeqRef.current.has(msg.command_id)) {
          nextSeqRef.current.set(msg.command_id, 1);
        }

        flushBuffer(msg.command_id);
      })
      .on("broadcast", { event: "out:done" }, (payload) => {
        const msg = payload.payload as {
          plan_id: string;
          command_id: string;
          exit_code: number;
          duration_ms: number;
        };

        if (msg.plan_id !== planId) return;

        setStreamedOutput((prev) => {
          const next = new Map(prev);
          const state = next.get(msg.command_id) ?? { chunks: [], done: false };
          next.set(msg.command_id, {
            ...state,
            done: true,
            exitCode: msg.exit_code,
            durationMs: msg.duration_ms,
          });
          return next;
        });
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      setIsStreaming(false);
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [machineId, planId, flushBuffer]);

  return { streamedOutput, isStreaming };
}
