import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Crown, Check, ArrowLeft } from "lucide-react";

const PREMIUM_PERKS = [
  "Unlimited projects",
  "AI Setup Architect blueprints",
  "Agent health monitoring",
  "Priority support",
];

export default function CheckoutCancel() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Crown className="h-8 w-8 text-muted-foreground" />
        </div>

        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-bold text-foreground">No worries!</h1>
          <p className="text-muted-foreground">
            You can upgrade anytime when you're ready. Here's what you'd get:
          </p>
        </div>

        <ul className="inline-flex flex-col items-start gap-2 text-sm text-muted-foreground">
          {PREMIUM_PERKS.map((p) => (
            <li key={p} className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-premium shrink-0" />
              {p}
            </li>
          ))}
        </ul>

        <div className="flex flex-col items-center gap-3 pt-2">
          <Link to="/projects">
            <Button variant="ghost" className="text-muted-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" /> Maybe later — back to dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
