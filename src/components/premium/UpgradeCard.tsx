import { Crown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCheckout } from "@/hooks/useCheckout";

interface Props {
  title: string;
  description: string;
  className?: string;
}

export function UpgradeCard({ title, description, className = "" }: Props) {
  const { startCheckout, loading } = useCheckout();

  return (
    <div className={`rounded-xl border border-premium/30 bg-premium/5 p-5 space-y-3 ${className}`}>
      <div className="flex items-center gap-2">
        <Crown className="h-5 w-5 text-premium" />
        <h3 className="font-heading text-sm font-semibold text-premium">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
      <Button
        size="sm"
        className="bg-premium text-premium-foreground hover:bg-premium/90"
        onClick={startCheckout}
        disabled={loading}
      >
        {loading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
        Upgrade — $25/mo
      </Button>
    </div>
  );
}
