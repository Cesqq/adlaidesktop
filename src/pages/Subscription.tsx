import { useSubscription } from "@/hooks/useSubscription";
import { useCheckout } from "@/hooks/useCheckout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Check, AlertTriangle, Loader2, ExternalLink } from "lucide-react";

const FREE_FEATURES = [
  "1 project",
  "Manual setup steps",
  "Community support",
  "Basic kanban board",
];

const PREMIUM_FEATURES = [
  "Unlimited projects",
  "AI Setup Architect blueprints",
  "Agent health monitoring",
  "Priority support",
  "Advanced verification checks",
  "All future premium features",
];

export default function Subscription() {
  const { isPremium, planStatus, currentPeriodEnd, cancelAtPeriodEnd, isLoading } = useSubscription();
  const { startCheckout, openPortal, loading } = useCheckout();

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <h1 className="font-heading text-3xl font-bold text-foreground">Subscription</h1>

      {/* Past due warning */}
      {planStatus === "past_due" && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-5 py-4">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Payment failed</p>
            <p className="text-xs text-muted-foreground">Please update your payment method to keep your subscription active.</p>
          </div>
          <Button size="sm" variant="outline" className="border-destructive/40 text-destructive" onClick={openPortal} disabled={loading}>
            Update Payment <ExternalLink className="ml-1.5 h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Current plan */}
      <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-foreground">Current Plan</h2>
          <Badge
            className={isPremium ? "gap-1 bg-premium/20 text-premium border-premium/30" : ""}
            variant={isPremium ? "default" : "outline"}
          >
            {isPremium && <Crown className="h-3 w-3" />}
            {isPremium ? "Lumina Premium" : "Free"}
          </Badge>
        </div>

        {isPremium && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs capitalize">{planStatus}</Badge>
              {cancelAtPeriodEnd && (
                <Badge variant="outline" className="text-xs text-destructive border-destructive/40">Canceling at period end</Badge>
              )}
            </div>
            {currentPeriodEnd && (
              <p className="text-sm text-muted-foreground">
                {cancelAtPeriodEnd ? "Access until" : "Renews"}{" "}
                {new Date(currentPeriodEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            )}
            <Button variant="outline" size="sm" className="mt-2" onClick={openPortal} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Manage Subscription <ExternalLink className="ml-1.5 h-3 w-3" />
            </Button>
          </div>
        )}

        {!isPremium && planStatus === "canceled" && (
          <p className="text-sm text-muted-foreground">Your premium subscription was canceled. Upgrade again anytime.</p>
        )}
      </section>

      {/* Comparison */}
      <section className="grid gap-4 md:grid-cols-2">
        {/* Free tier */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div>
            <h3 className="font-heading text-lg font-semibold text-foreground">Free</h3>
            <p className="text-2xl font-bold text-foreground mt-1">$0<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
          </div>
          <ul className="space-y-2">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          {!isPremium && (
            <Badge variant="outline" className="text-xs">Current Plan</Badge>
          )}
        </div>

        {/* Premium tier */}
        <div className={`rounded-2xl border p-6 space-y-4 ${isPremium ? "border-premium/40 bg-premium/5" : "border-premium/30 bg-card"}`}>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-lg font-semibold text-foreground">Lumina Premium</h3>
              <Crown className="h-4 w-4 text-premium" />
            </div>
            <p className="text-2xl font-bold text-foreground mt-1">$25<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
          </div>
          <ul className="space-y-2">
            {PREMIUM_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                <Check className="h-3.5 w-3.5 text-premium shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          {isPremium ? (
            <Badge className="bg-premium/20 text-premium border-premium/30 gap-1">
              <Crown className="h-2.5 w-2.5" /> Your Plan
            </Badge>
          ) : (
            <Button
              className="w-full bg-premium text-premium-foreground hover:bg-premium/90"
              onClick={startCheckout}
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Crown className="mr-2 h-4 w-4" /> Upgrade to Premium
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
