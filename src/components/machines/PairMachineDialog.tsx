import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, CheckCircle2, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const SAFE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generateCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)];
  }
  return code;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PairMachineDialog({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [consumed, setConsumed] = useState(false);
  const [machineLabel, setMachineLabel] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval>>();
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const createCode = useCallback(async () => {
    if (!user) return;
    setGenerating(true);
    setConsumed(false);
    setMachineLabel(null);
    const newCode = generateCode();
    const expires = new Date(Date.now() + 5 * 60 * 1000);

    const { error } = await supabase.from("pairing_codes").insert({
      code: newCode,
      user_id: user.id,
      expires_at: expires.toISOString(),
    });

    if (error) {
      toast({ title: "Error generating code", description: error.message, variant: "destructive" });
      setGenerating(false);
      return;
    }

    setCode(newCode);
    setExpiresAt(expires);
    setSecondsLeft(300);
    setGenerating(false);
  }, [user]);

  // Auto-generate on open
  useEffect(() => {
    if (open && !code && !consumed) {
      createCode();
    }
    if (!open) {
      setCode(null);
      setExpiresAt(null);
      setConsumed(false);
      setMachineLabel(null);
      clearInterval(pollRef.current);
      clearInterval(timerRef.current);
    }
  }, [open, code, consumed, createCode]);

  // Countdown timer
  useEffect(() => {
    if (!expiresAt || consumed) return;
    timerRef.current = setInterval(() => {
      const left = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0) clearInterval(timerRef.current);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [expiresAt, consumed]);

  // Poll for consumption
  useEffect(() => {
    if (!code || consumed) return;
    pollRef.current = setInterval(async () => {
      const { data } = await supabase
        .from("pairing_codes")
        .select("consumed_at, consumed_machine_id")
        .eq("code", code)
        .single();

      if (data?.consumed_at) {
        setConsumed(true);
        clearInterval(pollRef.current);
        clearInterval(timerRef.current);

        if (data.consumed_machine_id) {
          const { data: machine } = await supabase
            .from("machines")
            .select("machine_label")
            .eq("id", data.consumed_machine_id)
            .single();
          setMachineLabel(machine?.machine_label ?? null);
        }

        queryClient.invalidateQueries({ queryKey: ["machines"] });
      }
    }, 3000);
    return () => clearInterval(pollRef.current);
  }, [code, consumed, queryClient]);

  const expired = secondsLeft <= 0 && !consumed;
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  const copyCode = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      toast({ title: "Code copied!" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{consumed ? "Machine Paired!" : "Pair New Machine"}</DialogTitle>
          <DialogDescription>
            {consumed
              ? "Your machine has been connected successfully."
              : "Enter this code in the companion app to pair your machine."}
          </DialogDescription>
        </DialogHeader>

        {consumed ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <CheckCircle2 className="h-16 w-16 text-[hsl(var(--success))]" />
            <p className="text-lg font-semibold text-foreground">Machine paired successfully!</p>
            {machineLabel && (
              <p className="text-sm text-muted-foreground">{machineLabel}</p>
            )}
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-5 py-4">
            {/* Code display */}
            <div className="flex items-center gap-3">
              <span
                className={`font-mono text-5xl tracking-[0.3em] font-bold ${
                  expired ? "text-muted-foreground line-through" : "text-foreground"
                }`}
              >
                {code ?? "------"}
              </span>
              <Button variant="ghost" size="icon" onClick={copyCode} disabled={!code || expired}>
                <Copy className="h-5 w-5" />
              </Button>
            </div>

            {/* Timer */}
            {!expired && (
              <p className="text-sm text-muted-foreground tabular-nums">
                Expires in {mins}:{secs.toString().padStart(2, "0")}
              </p>
            )}

            {expired && (
              <div className="text-center space-y-3">
                <p className="text-sm text-destructive">Code expired</p>
                <Button onClick={createCode} disabled={generating} variant="outline" className="gap-2">
                  <RefreshCw className="h-4 w-4" /> Generate New Code
                </Button>
              </div>
            )}

            {/* Deep link */}
            {!expired && code && (
              <Button variant="outline" className="gap-2" asChild>
                <a href={`adlai-studio://pair?code=${code}`}>
                  <ExternalLink className="h-4 w-4" /> Open Companion App
                </a>
              </Button>
            )}

            <p className="text-xs text-muted-foreground text-center">
              Companion app must be installed first.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
