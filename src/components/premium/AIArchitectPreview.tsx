import { Lock, Crown, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCheckout } from "@/hooks/useCheckout";

export function AIArchitectPreview() {
  const { startCheckout, loading } = useCheckout();

  return (
    <div className="relative rounded-2xl border border-border bg-card overflow-hidden">
      {/* Grayed-out blueprint preview */}
      <div className="p-5 space-y-3 opacity-25 blur-[1px] pointer-events-none select-none">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-heading text-sm font-semibold text-foreground">AI Setup Architect</span>
        </div>
        <div className="space-y-2">
          <div className="h-3 w-4/5 rounded bg-muted" />
          <div className="h-3 w-3/5 rounded bg-muted" />
          <div className="h-3 w-2/3 rounded bg-muted" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="h-16 rounded-lg bg-muted" />
          <div className="h-16 rounded-lg bg-muted" />
        </div>
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/70 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-3 text-center px-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-premium/10 border border-premium/30">
            <Lock className="h-4 w-4 text-premium" />
          </div>
          <div>
            <p className="font-heading text-sm font-semibold text-foreground">AI Setup Architect</p>
            <p className="text-xs text-muted-foreground mt-1">
              Get an AI-generated blueprint tailored to your exact setup
            </p>
          </div>
          <Button
            size="sm"
            className="bg-premium text-premium-foreground hover:bg-premium/90"
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
