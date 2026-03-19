import { Lock, Crown, Activity, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCheckout } from "@/hooks/useCheckout";

export function HealthMonitorTab() {
  const { startCheckout, loading } = useCheckout();

  return (
    <div className="relative rounded-xl border border-border bg-card p-8 overflow-hidden">
      {/* Blurred preview behind lock */}
      <div className="space-y-4 opacity-20 blur-[2px] pointer-events-none select-none">
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 text-success" />
          <span className="font-heading text-lg font-semibold text-foreground">Agent Health Monitor</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {["CPU Usage", "Memory", "Uptime"].map((label) => (
            <div key={label} className="rounded-lg bg-muted p-4 space-y-2">
              <p className="text-xs text-muted-foreground">{label}</p>
              <div className="h-2 w-3/4 rounded-full bg-success/30" />
            </div>
          ))}
        </div>
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/60 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-premium/10 border border-premium/30">
            <Lock className="h-5 w-5 text-premium" />
          </div>
          <div>
            <p className="font-heading text-sm font-semibold text-foreground">Premium Feature</p>
            <p className="text-xs text-muted-foreground mt-1">AI-powered agent health monitoring</p>
          </div>
          <Button
            size="sm"
            className="bg-premium text-premium-foreground hover:bg-premium/90 mt-1"
            onClick={startCheckout}
            disabled={loading}
          >
            {loading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Crown className="mr-2 h-3.5 w-3.5" />}
            Unlock with Premium
          </Button>
        </div>
      </div>
    </div>
  );
}
